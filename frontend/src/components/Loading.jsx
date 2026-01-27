import { FiLoader } from "react-icons/fi";

const Loading = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="flex flex-col items-center animate-pulse">
                <FiLoader className="text-4xl animate-spin text-blue-500 mb-4" />
                <p className="text-gray-400 text-sm">Cargando...</p>
            </div>
        </div>
    );
};

export default Loading;
