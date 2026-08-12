import { recruitmentService } from '../services/recruitment/recruitmentService.js';
import { uploadFileToStorage } from '../services/storage/blobService.js';

// Helper for tenant extraction
const getTenantId = (req) => req.tenantId || req.user?.tenantId || null;

// RF-REC-001: Create Vacancy
export const createVacancy = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const vacancy = await recruitmentService.createVacancy(req.body, req.user.id, tenantId);
        res.status(201).json(vacancy);
    } catch (error) {
        console.error("Error creating vacancy:", error);
        res.status(500).json({ message: error.message || "Error al crear la vacante" });
    }
};

export const getVacancies = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const vacancies = await recruitmentService.getVacancies(tenantId);
        res.json(vacancies);
    } catch (error) {
        console.error("Error getting vacancies:", error);
        res.status(500).json({ message: error.message || "Error al obtener vacantes" });
    }
};

export const getPublicVacancies = async (req, res) => {
    try {
        const { tenantId, companySlug } = req.query;
        const vacancies = await recruitmentService.getPublicVacancies({ tenantId, companySlug });
        res.json(vacancies);
    } catch (error) {
        console.error("Error getting public vacancies:", error);
        res.status(500).json({ message: error.message || "Error al obtener ofertas" });
    }
};

export const getVacancyById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const vacancy = await recruitmentService.getVacancyById(id, tenantId);
        res.json(vacancy);
    } catch (error) {
        const status = error.message?.includes("Acceso denegado") ? 403 : 404;
        res.status(status).json({ message: error.message });
    }
};

export const updateVacancyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const tenantId = getTenantId(req);
        const vacancy = await recruitmentService.updateVacancyStatus(id, status, tenantId);
        res.json(vacancy);
    } catch (error) {
        const statusCode = error.message?.includes("Acceso denegado") ? 403 : 500;
        res.status(statusCode).json({ message: error.message || "Error al actualizar estado" });
    }
};

export const deleteVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const result = await recruitmentService.deleteVacancy(id, tenantId);
        res.json(result);
    } catch (error) {
        console.error("Error deleting vacancy:", error);
        const status = error.message?.includes("Acceso denegado") || error.message?.includes("permisos") ? 403 : 500;
        res.status(status).json({ message: error.message || "Error al eliminar la vacante" });
    }
};

export const applyToVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        let resumeUrl = null;
        if (req.file) {
            resumeUrl = await uploadFileToStorage(req.file, 'resumes');
        }
        const application = await recruitmentService.applyToVacancy(id, req.body, resumeUrl);
        res.status(201).json({ message: "Postulación enviada exitosamente", applicationId: application.id });
    } catch (error) {
        console.error("Error submitting application:", error);
        const status = error.message?.includes("obligatorio") || error.message?.includes("postulado") ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
};

export const getApplicationsByVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const applications = await recruitmentService.getApplicationsByVacancy(id, tenantId);
        res.json(applications);
    } catch (error) {
        const status = error.message?.includes("Acceso denegado") ? 403 : 500;
        res.status(status).json({ message: error.message || "Error al obtener postulaciones" });
    }
};

export const getApplicationDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const application = await recruitmentService.getApplicationDetails(id, tenantId);
        res.json(application);
    } catch (error) {
        const status = error.message?.includes("Acceso denegado") ? 403 : 404;
        res.status(status).json({ message: error.message });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, sendEmail } = req.body;
        const tenantId = getTenantId(req);
        const application = await recruitmentService.updateApplicationStatus(id, status, sendEmail, tenantId);
        res.json(application);
    } catch (error) {
        const statusCode = error.message?.includes("Acceso denegado") ? 403 : 500;
        res.status(statusCode).json({ message: error.message || "Error al actualizar estado" });
    }
};

export const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const result = await recruitmentService.deleteCandidate(id, tenantId);
        res.json(result);
    } catch (error) {
        console.error("Error deleting candidate application:", error);
        const status = error.message?.includes("Acceso denegado") ? 403 : 500;
        res.status(status).json({ message: error.message || "Error al eliminar la postulación del candidato" });
    }
};

export const addApplicationNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const userName = `${req.user.firstName} ${req.user.lastName}`;
        const tenantId = getTenantId(req);

        const note = await recruitmentService.addNote(id, content, userId, userName, tenantId);
        res.json(note);
    } catch (error) {
        console.error(error);
        const status = error.message?.includes("Acceso denegado") ? 403 : 500;
        res.status(status).json({ message: error.message || "Error al agregar nota" });
    }
};

export const scheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const interview = await recruitmentService.scheduleInterview(id, req.body, req.user.id, tenantId);
        res.json(interview);
    } catch (error) {
        console.error("Error scheduling interview:", error);
        const status = error.message?.includes("Acceso denegado") ? 403 : 500;
        res.status(status).json({ message: error.message || "Error al programar entrevista" });
    }
};

export const evaluateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const evaluation = await recruitmentService.evaluateCandidate(id, req.body, req.user.id, tenantId);
        res.json(evaluation);
    } catch (error) {
        console.error("Error evaluating candidate:", error);
        const status = error.message?.includes("Acceso denegado") ? 403 : 500;
        res.status(status).json({ message: error.message || "Error al registrar evaluación" });
    }
};

export const hireCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = getTenantId(req);
        const result = await recruitmentService.hireCandidate(id, req.body, tenantId);
        res.json({ message: "Candidato contratado exitosamente", employee: result });
    } catch (error) {
        console.error("Error hiring candidate:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "La cédula o el email ya están registrados en el sistema." });
        }
        const status = error.message?.includes("Acceso denegado") ? 403 : (error.message?.includes("18 años") || error.message?.includes("contraseña") ? 400 : 500);
        res.status(status).json({ message: error.message || "Error al contratar candidato" });
    }
};
