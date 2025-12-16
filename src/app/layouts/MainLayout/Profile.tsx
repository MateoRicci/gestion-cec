// Import Dependencies
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Avatar, AvatarDot, Button } from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";

// ----------------------------------------------------------------------

export function Profile() {
  const { logout, user } = useAuthContext();
  const username = user?.usuario || "Usuario";

  return (
    <Popover className="relative">
      <PopoverButton
        as={Avatar}
        size={12}
        role="button"
        name={username}
        alt="Profile"
        indicator={
          <AvatarDot color="success" className="ltr:right-0 rtl:left-0" />
        }
        className="cursor-pointer"

      />
      <Transition
        enter="duration-200 ease-out"
        enterFrom="translate-x-2 opacity-0"
        enterTo="translate-x-0 opacity-100"
        leave="duration-200 ease-out"
        leaveFrom="translate-x-0 opacity-100"
        leaveTo="translate-x-2 opacity-0"
      >
        <PopoverPanel
          anchor={{ to: "right end", gap: 12 }}
          className="z-70 flex w-64 flex-col rounded-lg border border-gray-150 bg-white shadow-soft transition dark:border-dark-600 dark:bg-dark-700 dark:shadow-none"
        >
          {() => (
            <>
              {/* User Info */}
              <div className="flex items-center gap-4 rounded-t-lg bg-gray-100 px-4 py-5 dark:bg-dark-800">
                <Avatar
                  size={14}
                  name={username}
                  alt="Profile"
                />
                <div>
                  <div className="text-base font-medium text-gray-700 dark:text-dark-100">
                    {username}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-dark-300">
                    {user?.email || user?.roles?.[0]?.nombre || "Usuario"}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <div className="flex flex-col pb-5 pt-2">
                <div className="px-4 pt-4">
                  <Button className="w-full gap-2" onClick={logout}>
                    <ArrowLeftStartOnRectangleIcon className="size-4.5" />
                    <span>Cerrar Sesión</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
