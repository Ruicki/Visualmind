@AGENTS.md

# Reglas de trabajo

## SRS obligatorio antes de desarrollar
Antes de empezar cualquier proyecto de software nuevo (o una funcionalidad grande), redactar primero un **SRS (Especificación de Requisitos de Software)** y validarlo con el usuario antes de escribir código.

El SRS debe incluir como mínimo (basado en IEEE 830 / ISO/IEC/IEEE 29148):
1. **Introducción**: propósito, alcance, definiciones, referencias.
2. **Descripción general**: perspectiva del producto, usuarios/roles, restricciones, supuestos y dependencias.
3. **Requisitos funcionales**: numerados (RF-01, RF-02…), cada uno con descripción, prioridad y criterios de aceptación.
4. **Requisitos no funcionales**: rendimiento, seguridad, disponibilidad, usabilidad, escalabilidad (RNF-01…).
5. **Interfaces**: de usuario, de API/software, de hardware y comunicaciones.
6. **Modelo de datos** principal (entidades y relaciones).
7. **Casos de uso / historias de usuario** clave.
8. **Fuera de alcance** y riesgos.

Guardar el SRS en `.specs/` (p. ej. `.specs/SRS-<proyecto>.md`) y mantenerlo actualizado cuando cambien los requisitos.
