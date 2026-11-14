/**
 * @file employeeBenefitController.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import employeeBenefitService from './employeeBenefit.service.js';

const getTenantId = (req) => req.tenantId || req.user?.tenantId;

class EmployeeBenefitController {
  async getAll(req, res) {
    try {
      const { page, limit, status, type, employeeId, search } = req.query;
      const result = await employeeBenefitService.getBenefits({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        status,
        type,
        employeeId,
        search,
        tenantId: getTenantId(req),
      });
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el listado de beneficios',
      });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await employeeBenefitService.getStats(getTenantId(req));
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas de beneficios',
      });
    }
  }

  async getByEmployee(req, res) {
    try {
      const benefits = await employeeBenefitService.getByEmployee(
        req.params.employeeId,
        getTenantId(req)
      );
      return res.status(200).json({ success: true, data: benefits });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener beneficios del empleado',
      });
    }
  }

  async create(req, res) {
    try {
      const { employeeId, name, amount, type, frequency } = req.body;
      const benefit = await employeeBenefitService.createBenefit(
        { employeeId, name, amount, type, frequency },
        getTenantId(req),
        req.user?.id
      );
      return res.status(201).json({
        success: true,
        message: 'Beneficio asignado exitosamente',
        data: benefit,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al asignar beneficio',
      });
    }
  }

  async bulkCreate(req, res) {
    try {
      const { employeeIds, name, amount, type, frequency, isSpecialCalculation } = req.body;
      const result = await employeeBenefitService.bulkCreate(
        { employeeIds, name, amount, type, frequency, isSpecialCalculation },
        getTenantId(req),
        req.user?.id
      );
      return res.status(201).json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error en asignación masiva de beneficios',
      });
    }
  }

  async update(req, res) {
    try {
      const { name, amount, type, frequency } = req.body;
      const updated = await employeeBenefitService.updateBenefit(
        req.params.id,
        { name, amount, type, frequency },
        getTenantId(req),
        req.user?.id
      );
      return res.status(200).json({
        success: true,
        message: 'Beneficio actualizado exitosamente',
        data: updated,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar beneficio',
      });
    }
  }

  async deactivate(req, res) {
    try {
      const updated = await employeeBenefitService.deactivate(
        req.params.id,
        getTenantId(req),
        req.user?.id
      );
      return res.status(200).json({
        success: true,
        message: 'Beneficio cancelado exitosamente',
        data: updated,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al cancelar beneficio',
      });
    }
  }
}

export default new EmployeeBenefitController();
