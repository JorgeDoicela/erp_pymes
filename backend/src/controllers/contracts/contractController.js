import contractService from '../../services/contracts/contractService.js';
import path from 'path';

class ContractController {
    async create(req, res) {
        try {
            const { employeeId, type, startDate, endDate, salary, clauses } = req.body;
            const file = req.file;

            const contractData = {
                employeeId,
                type,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                salary: parseFloat(salary),
                clauses,
                documentUrl: file ? file.filename : null
            };

            const contract = await contractService.createContract(contractData);

            res.status(201).json({
                success: true,
                data: contract,
                message: 'Contrato registrado exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getByEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const contracts = await contractService.getContractsByEmployee(employeeId);
            res.json({ success: true, data: contracts });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async downloadContract(req, res) {
        try {
            const { filename } = req.params;
            // Security check: prevent directory traversal
            if (filename.includes('..')) {
                return res.status(400).send('Nombre de archivo inválido');
            }

            const filePath = path.resolve('uploads/contracts', filename);
            res.download(filePath);
        } catch (error) {
            res.status(404).json({ success: false, message: 'Archivo no encontrado' });
        }
    }
}

export default new ContractController();
