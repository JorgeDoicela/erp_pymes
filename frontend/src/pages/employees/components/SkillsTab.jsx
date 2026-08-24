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

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            const response = await createSkill({ ...skillForm, employeeId }, token);
            // Optimistic update using returned data
            if (onAddSkill && response.data) {
                onAddSkill(response.data);
            } else {
                await onUpdate();
            }

            setIsAddingSkill(false);
            setSkillForm({ name: '', level: 'Intermediate' });
            toast.success('Habilidad agregada correctamente');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeleteSkill = async (skillId) => {
        if (!confirm('¿Eliminar esta habilidad?')) return;
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
        <div>
            <div className="flex justify-end mb-4">
                {(user?.id === employeeId) && (
                    <button
                        onClick={() => setIsAddingSkill(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Nueva Habilidad
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-3">
                {skills && skills.length > 0 ? (
                    skills.map((skill) => (
                        <div key={skill.id} className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm flex items-center gap-2 group shadow-sm hover:shadow-md transition-all">
                            <span className="text-slate-700 font-medium">{skill.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getLevelColor(skill.level)}`}>{skill.level}</span>
                            {(user?.id === employeeId) && (
                                <button
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <EmptyState message="No hay habilidades registradas." />
                )}
            </div>

            {/* Add Skill Modal */}
            {isAddingSkill && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded p-5 w-full max-w-md border border-gray-200 shadow-xl text-xs space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Añadir Habilidad Técnica</h2>
                            <button onClick={() => setIsAddingSkill(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleAddSkill} className="space-y-3">
                            <InputField
                                label="Habilidad"
                                name="name"
                                value={skillForm.name}
                                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                            />
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Nivel de Dominio</label>
                                <select
                                    value={skillForm.level}
                                    onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                >
                                    {SKILL_LEVELS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button type="button" onClick={() => setIsAddingSkill(false)} className="px-3 py-1.5 rounded text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition-colors">Guardar Habilidad</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsTab;
