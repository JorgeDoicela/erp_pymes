# 04. Motor Biométrico y Seguridad de Credenciales

## 1. Integración con Dispositivos y Credenciales Biométricas

EMPLIFI cuenta con una capa de abstracción para la gestión de credenciales biométricas (reloj de control de asistencia de huella digital, reconocimiento facial o tarjetas RFID).

```prisma
model BiometricCredential {
 id String @id @default(cuid())
 employeeId String
 biometricId String @unique // ID asignado en el reloj checador / hardware
 credentialType String // "FINGERPRINT", "FACE_RECOGNITION", "RFID_CARD"
 templateHash String? // Hash o plantilla matematica de la huella/rostro
 isActive Boolean @default(true)
 createdAt DateTime @default(now())
 employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
}
```

---

## 2. Seguridad de Contraseñas y Datos de Sesión

1. **Hashing de Contraseñas (`bcrypt`)**:
 - Las contraseñas de los usuarios no se almacenan nunca en texto claro.
 - Se utiliza **Bcrypt** con factor de costo (salt rounds = 10) para resistir ataques de fuerza bruta y diccionarios.
2. **Tokens de Sesión y Expiración**:
 - Los tokens de restablecimiento de contraseña (`resetPasswordToken`) utilizan cadenas criptográficas aleatorias (`crypto.randomBytes(32).toString('hex')`) con vida útil limitada (`resetPasswordExpires`).
