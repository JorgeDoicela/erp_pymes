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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">Nueva Habilidad</h2>
                        <form onSubmit={handleAddSkill} className="space-y-4">
                            <InputField
                                label="Habilidad"
                                name="name"
                                value={skillForm.name}
                                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                            />
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Nivel</label>
                                <select
                                    value={skillForm.level}
                                    onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
                                >
                                    {SKILL_LEVELS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAddingSkill(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hover:shadow-md transition-all">Agregar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsTab;
