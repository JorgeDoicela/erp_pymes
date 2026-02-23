import { recruitmentService } from '../services/recruitment/recruitmentService.js';

// RF-REC-001: Create Vacancy
export const createVacancy = async (req, res) => {
    try {
        const vacancy = await recruitmentService.createVacancy(req.body, req.user.id);
        res.status(201).json(vacancy);
    } catch (error) {
        console.error("Error creating vacancy:", error);
        res.status(500).json({ message: error.message || "Error al crear la vacante" });
    }
};

export const getVacancies = async (req, res) => {
    try {
        const vacancies = await recruitmentService.getVacancies();
        res.json(vacancies);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vacantes" });
    }
};

export const getPublicVacancies = async (req, res) => {
    try {
        const vacancies = await recruitmentService.getPublicVacancies();
        res.json(vacancies);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener ofertas" });
    }
};

export const getVacancyById = async (req, res) => {
    try {
        const { id } = req.params;
        const vacancy = await recruitmentService.getVacancyById(id);
        res.json(vacancy);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const updateVacancyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const vacancy = await recruitmentService.updateVacancyStatus(id, status);
        res.json(vacancy);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado" });
    }
};

export const applyToVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        const resumeUrl = req.file ? req.file.path : null;
        const application = await recruitmentService.applyToVacancy(id, req.body, resumeUrl);
        res.status(201).json({ message: "Postulación enviada exitosamente", applicationId: application.id });
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(error.message.includes("obligatorio") ? 400 : 500).json({ message: error.message });
    }
};

export const getApplicationsByVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        const applications = await recruitmentService.getApplicationsByVacancy(id);
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener postulaciones" });
    }
};

export const getApplicationDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await recruitmentService.getApplicationDetails(id);
        res.json(application);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const application = await recruitmentService.updateApplicationStatus(id, status);
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado" });
    }
};

export const addApplicationNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const userName = `${req.user.firstName} ${req.user.lastName}`;

        const note = await recruitmentService.addNote(id, content, userId, userName);
        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar nota" });
    }
};

export const scheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const interview = await recruitmentService.scheduleInterview(id, req.body, req.user.id);
        res.json(interview);
    } catch (error) {
        console.error("Error scheduling interview:", error);
        res.status(500).json({ message: "Error al programar entrevista" });
    }
};

export const evaluateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const evaluation = await recruitmentService.evaluateCandidate(id, req.body, req.user.id);
        res.json(evaluation);
    } catch (error) {
        console.error("Error evaluating candidate:", error);
        res.status(500).json({ message: "Error al registrar evaluación" });
    }
};

export const hireCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await recruitmentService.hireCandidate(id, req.body);
        res.json({ message: "Candidato contratado exitosamente", employee: result });
    } catch (error) {
        console.error("Error hiring candidate:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "La cédula o el email ya están registrados en el sistema." });
        }
        res.status(500).json({ message: "Error al contratar candidato: " + error.message });
    }
};
