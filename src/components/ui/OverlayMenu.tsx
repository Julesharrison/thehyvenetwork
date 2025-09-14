import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';

// TypeScript Interfaces
export interface MenuAction {
  type: 'navigate' | 'callback' | 'navigate-new-tab';
  path?: string;
  handler?: () => void;
}

export interface MenuItem {
  label: string;
  action: MenuAction;
}

export interface OverlayMenuProps {
  customMenuItems?: MenuItem[];
  onAbout?: () => void;
  onTermsAndConditions?: () => void;
  onLogout?: () => void;
  onEditStageName?: () => void;
  aboutPath?: string;
  termsPath?: string;
  showEditStageName?: boolean;
}

const OverlayMenu: React.FC<OverlayMenuProps> = ({
  customMenuItems = [],
  onAbout,
  onTermsAndConditions,
  onLogout,
  onEditStageName,
  aboutPath = '/about',
  termsPath = '/terms',
  showEditStageName = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleMenuItemClick = (action: MenuAction, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (action.type === 'navigate' && action.path) {
      setShowMenu(false);
      navigate(action.path);
    } else if (action.type === 'navigate-new-tab' && action.path) {
      setShowMenu(false);
      window.open(action.path, '_blank');
    } else if (action.type === 'callback' && action.handler) {
      setShowMenu(false);
      setTimeout(() => {
        action.handler!();
      }, 50);
    }
  };

  const handleAboutClick = () => {
    if (onAbout) {
      onAbout();
    } else {
      navigate(aboutPath);
    }
    setShowMenu(false);
  };

  const handleTermsClick = () => {
    if (onTermsAndConditions) {
      onTermsAndConditions();
    } else {
      navigate(termsPath);
    }
    setShowMenu(false);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    setShowMenu(false);
  };

  const handleEditStageNameClick = () => {
    console.log("Edit stage name clicked - direct handler");
    setShowMenu(false);
    if (onEditStageName) {
      setTimeout(() => {
        onEditStageName();
      }, 100);
    }
  };

  return (
    <div className="w-full flex justify-end relative">
      {/* Menu button */}
      <button
        onClick={() => setShowMenu(true)}
        className="hover:opacity-80 transition-colors"
        aria-label="Open menu"
      >
        <MenuIcon className="w-6 h-6 text-primary" />
      </button>

      {/* Overlay Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center animate-slideIn">
          {/* Close button (responsive positioning) */}
          <button
            onClick={() => setShowMenu(false)}
            className="absolute top-6 right-4 sm:right-6 md:right-8 hover:opacity-80 transition"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Menu items */}
          <div className="flex flex-col space-y-5 text-center max-w-xs">
            {/* Custom menu items (user-specific) */}
            {customMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={(e) => handleMenuItemClick(item.action, e)}
                className="text-xl font-normal text-primary hover:text-primary/80 transition"
              >
                {item.label}
              </button>
            ))}

            {/* Edit stage name button (only for artists) */}
            {showEditStageName && (
              <button
                onClick={handleEditStageNameClick}
                className="text-xl font-normal text-primary hover:text-primary/80 transition"
              >
                Edit stage name
              </button>
            )}

            {/* Divider - only show if there are custom items or edit stage name */}
            {(customMenuItems.length > 0 || showEditStageName) && (
              <div className="w-48 h-px bg-primary/30 my-3 mx-auto"></div>
            )}

            {/* Common menu items (always present) */}
            <button
              onClick={handleAboutClick}
              className="text-xl font-normal text-primary hover:text-primary/80 transition"
            >
              About
            </button>

            <button
              onClick={handleTermsClick}
              className="text-xl font-normal text-primary hover:text-primary/80 transition"
            >
              Terms & Conditions
            </button>

            <button
              onClick={handleLogoutClick}
              className="text-xl font-normal text-primary hover:text-primary/80 transition"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayMenu;