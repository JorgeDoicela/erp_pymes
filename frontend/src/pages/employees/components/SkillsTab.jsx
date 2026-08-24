import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createSkill, deleteSkill } from '../../../services/employees/employee.service';
import { getLevelColor, EmptyState, InputField } from './EmployeeHelpers';
import { SKILL_LEVELS } from '../../../constants/employeeOptions';

const SkillsTab = ({ skills, user, employeeId, token, onUpdate, onAddSkill, onDeleteSkill }) => {
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [skillForm, setSkillForm] = useState({
        name: '',
        level: 'Intermediate'
    });

    const isSelfOrAdmin = (user?.id === employeeId) || user?.role === 'admin' || user?.role === 'hr';

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            const response = await createSkill({ ...skillForm, employeeId }, token);
            if (onAddSkill && response.data) {
                onAddSkill(response.data);
            } else {
                await onUpdate();
            }

            setIsAddingSkill(false);
            setSkillForm({ name: '', level: 'Intermediate' });
            toast.success('Habilidad registrada correctamente');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeleteSkill = async (skillId) => {
        if (!confirm('¿Eliminar esta habilidad técnica?')) return;
        try {
            await deleteSkill(skillId, token);

            if (onDeleteSkill) {
                onDeleteSkill(skillId);
            } else {
                await onUpdate();
            }

            toast.success('Habilidad eliminada');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Competencias y Habilidades Técnicas</h3>
                    <p className="text-[11px] text-gray-400">Listado de conocimientos técnicos certificados y validados en la organización.</p>
                </div>
                {isSelfOrAdmin && (
                    <button
                        onClick={() => setIsAddingSkill(true)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                        + Nueva Habilidad
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2.5">
                {skills && skills.length > 0 ? (
                    skills.map((skill) => (
                        <div key={skill.id} className="bg-white px-3 py-1.5 rounded border border-gray-200 text-xs flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{skill.name}</span>
                            <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getLevelColor(skill.level)}`}>
                                {skill.level}
                            </span>
                            {isSelfOrAdmin && (
                                <button
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    className="text-gray-400 hover:text-rose-600 cursor-pointer ml-0.5 text-xs font-bold"
                                    title="Eliminar habilidad"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <EmptyState message="No hay competencias o habilidades registradas." />
                )}
            </div>

            {/* Add Skill Modal */}
            {isAddingSkill && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md text-xs space-y-4">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Añadir Habilidad Técnica</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Especifica la competencia y el grado de experiencia profesional.</p>
                            </div>
                            <button 
                                onClick={() => setIsAddingSkill(false)} 
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleAddSkill} className="p-5 space-y-3">
                            <InputField
                                label="Nombre de la Habilidad / Competencia"
                                name="name"
                                value={skillForm.name}
                                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                                help="Ej. React.js, PostgreSQL, Liderazgo de Equipos..."
                            />
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Nivel de Dominio</label>
                                <select
                                    value={skillForm.level}
                                    onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                >
                                    {SKILL_LEVELS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddingSkill(false)} 
                                    className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer shadow-xs"
                                >
                                    Guardar Habilidad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsTab;
