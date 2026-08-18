/**
 * @file rdpAccountant.js
 * @description Módulo de Cálculo Analítico Exacto de Privacidad Diferencial de Rényi (RDP Accountant) para DP-SGD.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 *
 * Referencias:
 *   [1] Mironov, I. (2017). "Rényi Differential Privacy". CSF 2017.
 *   [2] Wang, Y. X., Balle, B., & Kasiviswanathan, S. (2019).
 *       "Subsampled Rényi Differential Privacy and Analytical Moments Accountant". AISTATS 2019.
 *   [3] Balle, B., Barthe, G., & Gaboardi, M. (2020).
 *       "Hypothesis Testing Interpretations and Renyi Differential Privacy". AISTATS 2020.
 *   [4] Abadi, M., Chu, A., Goodfellow, I., et al. (2016).
 *       "Deep Learning with Differential Privacy". ACM CCS 2016.
 *
 * Notación:
 *   sigma_M  = noiseMultiplier = sigma / C  (ratio de ruido sobre norma de recorte L2)
 *   q        = samplingRate = |batch| / N   (tasa de submuestreo de Poisson)
 *   alpha    = orden de Rényi
 *   delta    = probabilidad de fallo (privacy failure probability)
 *   epsilon  = presupuesto de privacidad en (epsilon,delta)-DP
 */

/**
 * Órdenes de Rényi evaluados en la minimización.
 * Rango elegido para cubrir tanto la región de convergencia rápida (bajos alpha)
 * como la región de privacidad fuerte (altos alpha).
 * @type {number[]}
 */
const RDP_ORDERS = [
    1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10,
    12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 128, 256
];

/**
 * Calcula la garantía RDP(alpha) del Mecanismo Gaussiano sin submuestreo.
 * Mironov (2017), Proposición 3:
 *   RDP_alpha(M_G) = alpha / (2 * sigma_M^2)
 *
 * @param {number} alpha          - Orden de Rényi alpha > 1
 * @param {number} noiseMultiplier - sigma_M = sigma / C
 * @returns {number} RDP(alpha)
 */
function gaussianRdp(alpha, noiseMultiplier) {
    if (noiseMultiplier <= 0) return Infinity;
    return alpha / (2.0 * noiseMultiplier * noiseMultiplier);
}

/**
 * Calcula la garantía RDP(alpha) del Mecanismo Gaussiano con submuestreo de Poisson.
 * Wang et al. (2019), Theorem 9 — cota superior cerrada para q < 0.5:
 *
 *   RDP_alpha_subsampled <= (1/(alpha-1)) * log(1 + q^2 * alpha * (exp((alpha-1)*RDP_full) - 1))
 *
 * Para alpha < 2 se usa la cota trivial RDP_full por estabilidad numérica.
 * Para q >= 1 (sin submuestreo) devuelve gaussianRdp directamente.
 *
 * @param {number} alpha           - Orden de Rényi alpha > 1
 * @param {number} noiseMultiplier - sigma_M = sigma / C
 * @param {number} samplingRate    - q en (0, 1]
 * @returns {number} RDP(alpha) con amplificación por submuestreo
 */
function subsampledGaussianRdp(alpha, noiseMultiplier, samplingRate) {
    if (samplingRate >= 1.0) return gaussianRdp(alpha, noiseMultiplier);
    if (samplingRate <= 0) throw new Error('samplingRate debe estar en (0, 1]');

    const q = samplingRate;
    const rdpFull = gaussianRdp(alpha, noiseMultiplier);

    // Para alpha < 2: la cota de Wang et al. no aplica directamente;
    // se usa cota trivial conservadora.
    if (alpha < 2.0) return rdpFull;

    // Cota superior del Theorem 9 de Wang et al. 2019
    const exponent = (alpha - 1.0) * rdpFull;
    // Protección numérica: si (alpha-1)*RDP_full es muy grande -> usar RDP_full
    if (exponent > 50) return rdpFull;

    const inner = q * q * alpha * (Math.exp(exponent) - 1.0);
    const rdpSubsampled = Math.log1p(inner) / (alpha - 1.0);

    // La cota subsampled nunca puede superar la cota sin submuestreo
    return Math.min(rdpFull, rdpSubsampled);
}

/**
 * Convierte una garantía RDP a (epsilon, delta)-DP mediante la conversión óptima de Balle et al. (2020).
 * Balle et al. (2020), Proposición 3:
 *
 *   epsilon(delta) = min_{alpha > 1} { RDP(alpha) - [log delta + log(alpha-1) - log alpha] / (alpha-1) }
 *
 * @param {number[]} rdpOrders   - Array de órdenes alpha evaluados
 * @param {number[]} rdpEpsilons - Array de garantías RDP(alpha) correspondientes
 * @param {number}   delta       - Probabilidad de fallo delta en (0, 1)
 * @returns {number} epsilon garantizado bajo (epsilon, delta)-DP
 */
function rdpToEpsilonDelta(rdpOrders, rdpEpsilons, delta) {
    if (delta <= 0 || delta >= 1) {
        throw new Error(`delta debe estar en (0, 1). Recibido: ${delta}`);
    }
    if (rdpOrders.length !== rdpEpsilons.length) {
        throw new Error('rdpOrders y rdpEpsilons deben tener la misma longitud');
    }

    let minEps = Infinity;
    const logDelta = Math.log(delta);

    for (let i = 0; i < rdpOrders.length; i++) {
        const alpha = rdpOrders[i];
        const rdp = rdpEpsilons[i];

        if (!isFinite(rdp) || alpha <= 1.0) continue;

        // Balle et al. (2020) Prop. 3:
        // epsilon = RDP(alpha) - [log delta + log(alpha-1) - log alpha] / (alpha-1)
        const correction = (logDelta + Math.log(alpha - 1.0) - Math.log(alpha)) / (alpha - 1.0);
        const eps = rdp - correction;

        if (eps >= 0 && eps < minEps) {
            minEps = eps;
        }
    }

    return isFinite(minEps) ? minEps : Infinity;
}

/**
 * Calcula el presupuesto de privacidad (epsilon, delta) acumulado para K rondas de DP-SGD.
 *
 * Composición RDP (Mironov 2017, Proposición 1):
 *   epsilon_K_rondas(alpha) = K * RDP_por_ronda(alpha)
 *
 * Luego se convierte el perfil RDP acumulado a (epsilon, delta)-DP.
 *
 * @param {object} params
 * @param {number} params.rounds             - Número de rondas de entrenamiento K
 * @param {number} params.noiseMultiplier    - sigma_M = sigma / C (ratio ruido/norma recorte)
 * @param {number} params.delta              - Probabilidad de fallo delta (tipicamente 1e-5)
 * @param {number} [params.samplingRate=1.0] - q = |batch| / N (1.0 = sin submuestreo)
 * @returns {{
 *   epsilonPerRound: number,
 *   epsilonAccumulated: number,
 *   delta: number,
 *   rounds: number,
 *   noiseMultiplier: number,
 *   samplingRate: number,
 *   optimalAlpha: number,
 *   privacyGuarantee: string
 * }}
 */
export function computePrivacyAccountant({ rounds, noiseMultiplier, delta, samplingRate = 1.0 }) {
    if (rounds <= 0) throw new Error('rounds debe ser > 0');
    if (noiseMultiplier <= 0) throw new Error('noiseMultiplier debe ser > 0');
    if (delta <= 0 || delta >= 1) throw new Error('delta debe estar en (0, 1)');
    if (samplingRate <= 0 || samplingRate > 1) throw new Error('samplingRate debe estar en (0, 1]');

    // RDP por ronda para cada orden alpha
    const rdpPerRound = RDP_ORDERS.map(alpha =>
        subsampledGaussianRdp(alpha, noiseMultiplier, samplingRate)
    );

    // Epsilon por ronda (1 ronda)
    const epsilonPerRound = rdpToEpsilonDelta(RDP_ORDERS, rdpPerRound, delta);

    // RDP acumulado tras K rondas (composición simple — Proposición 1, Mironov 2017)
    const rdpAccumulated = rdpPerRound.map(rdp => rdp * rounds);
    const epsilonAccumulated = rdpToEpsilonDelta(RDP_ORDERS, rdpAccumulated, delta);

    // Orden alpha óptimo (el que minimiza epsilon en la conversión acumulada)
    let optimalAlpha = RDP_ORDERS[0];
    let minEps = Infinity;
    const logDelta = Math.log(delta);
    for (let i = 0; i < RDP_ORDERS.length; i++) {
        const alpha = RDP_ORDERS[i];
        const rdp = rdpAccumulated[i];
        if (!isFinite(rdp) || alpha <= 1.0) continue;
        const correction = (logDelta + Math.log(alpha - 1.0) - Math.log(alpha)) / (alpha - 1.0);
        const eps = rdp - correction;
        if (eps >= 0 && eps < minEps) {
            minEps = eps;
            optimalAlpha = alpha;
        }
    }

    return {
        epsilonPerRound: Number(epsilonPerRound.toFixed(4)),
        epsilonAccumulated: Number(epsilonAccumulated.toFixed(4)),
        delta,
        rounds,
        noiseMultiplier,
        samplingRate,
        optimalAlpha: Number(optimalAlpha.toFixed(2)),
        privacyGuarantee: `(epsilon=${epsilonAccumulated.toFixed(3)}, delta=${delta})-DP tras ${rounds} rondas — RDP Accountant [Mironov 2017; Balle et al. 2020]`
    };
}

/**
 * Calcula unicamente epsilon para UNA ronda (conveniencia para federatedLearningService).
 *
 * @param {number} noiseMultiplier    - sigma_M = sigma / C
 * @param {number} delta              - delta en (0, 1)
 * @param {number} [samplingRate=1.0] - q en (0, 1]
 * @returns {number} epsilon de una ronda
 */
export function computeEpsilonPerRound(noiseMultiplier, delta, samplingRate = 1.0) {
    const rdpPerRound = RDP_ORDERS.map(alpha =>
        subsampledGaussianRdp(alpha, noiseMultiplier, samplingRate)
    );
    return rdpToEpsilonDelta(RDP_ORDERS, rdpPerRound, delta);
}
