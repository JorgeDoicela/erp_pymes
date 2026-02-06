import { FiMenu } from 'react-icons/fi';
import NotificationBell from '../common/NotificationBell';

const Header = ({ user, onMenuClick, title = "Panel de Control" }) => {
    return (
        <header className="h-16 bg-blue-950 text-white border-b border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-white/70 hover:text-white md:hidden"
                >
                    <FiMenu size={24} />
                </button>
                <h2 className="text-lg font-semibold tracking-wide">{title}</h2>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-3 text-right bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    <div className="text-right">
                        <p className="text-sm font-medium text-white">{user?.firstName || 'Admin'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
