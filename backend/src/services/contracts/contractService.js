import contractRepository from '../../repositories/contracts/contractRepository.js';
import employeeRepository from '../../repositories/employees/employeeRepository.js';

class ContractService {
    async createContract(data) {
        // Validate end date > start date
        if (data.startDate && data.endDate) {
            if (new Date(data.endDate) <= new Date(data.startDate)) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
        }

        // Verify employee exists
        const employee = await employeeRepository.findById(data.employeeId);
        if (!employee) {
            throw new Error('Empleado no encontrado');
        }

        return await contractRepository.create(data);
    }

    async getContractsByEmployee(employeeId) {
        return await contractRepository.findByEmployeeId(employeeId);
    }
}

export default new ContractService();
