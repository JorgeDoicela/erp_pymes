# Motor Biométrico y Seguridad de Credenciales

## 1. Arquitectura de Credenciales Biométricas

El subsistema biométrico administra vectores numéricos y plantillas matemáticas codificadas vinculadas a la identidad de los colaboradores. La entidad `BiometricCredential` en PostgreSQL almacena la información de verificación sin registrar la imagen fotográfica ni la huella dactilar original en texto plano.

```prisma
model BiometricCredential {
  id             String   @id @default(cuid())
  employeeId     String
  biometricId    String   @unique // Identificador asignado en el dispositivo o cliente web
  credentialType String   // "FINGERPRINT", "FACE_RECOGNITION", "RFID_CARD"
  templateHash   String?  // Vector de incrustación (embedding) o plantilla codificada
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  employee       Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
  @@map("biometric_credentials")
}
```

---

## 2. Comparación de Vectores de Incrustación (Face Embedding Matching)

Para la verificación facial en marcaciones de asistencia, se comparan los vectores de características flotantes $\mathbf{u}$ y $\mathbf{v}$ (dimensión 128 o 512) mediante la distancia euclidiana o la similitud del coseno:

### 2.1. Distancia Euclidiana
$$d(\mathbf{u}, \mathbf{v}) = \sqrt{\sum_{i=1}^{n} (u_i - v_i)^2}$$
Una marcación se considera válida si $d(\mathbf{u}, \mathbf{v}) < \theta_{\text{umbral}}$ (donde $\theta_{\text{umbral}} = 0.6$).

### 2.2. Similitud del Coseno
$$\text{Similitud}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|} = \frac{\sum_{i=1}^{n} u_i v_i}{\sqrt{\sum_{i=1}^{n} u_i^2} \sqrt{\sum_{i=1}^{n} v_i^2}}$$

---

## 3. Seguridad de Contraseñas y Gestión de Claves

1. **Hashing Salteado de Contraseñas (`Bcrypt`)**: Las credenciales de acceso se procesan utilizando el algoritmo Bcrypt con $10$ rondas de salteado (`saltRounds = 10`), garantizando protección contra ataques de fuerza bruta y tablas arcoíris (*rainbow tables*).
2. **Tokens Temporalmente Acotados para Reset de Credenciales**: Los tokens de recuperación (`resetPasswordToken`) se generan mediante `crypto.randomBytes(32).toString('hex')` y poseen una ventana de caducidad estricta (`resetPasswordExpires`) de 1 hora.
