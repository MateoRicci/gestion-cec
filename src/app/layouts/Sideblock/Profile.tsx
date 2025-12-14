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

export function Profile() {
  const { logout, user } = useAuthContext();
  const username = user?.usuario || "Usuario";

  return (
    <Popover className="relative flex">
      <PopoverButton
        as={Avatar}
        size={9}
        role="button"
        name={username}
        indicator={
          <AvatarDot
            color="success"
            className="-m-0.5 size-3 ltr:right-0 rtl:left-0"
          />
        }
        className="cursor-pointer"
      />
      <Transition
        enter="duration-200 ease-out"
        enterFrom="translate-y-2 opacity-0"
        enterTo="translate-y-0 opacity-100"
        leave="duration-200 ease-out"
        leaveFrom="translate-y-0 opacity-100"
        leaveTo="translate-y-2 opacity-0"
      >
        <PopoverPanel
          anchor={{ to: "bottom end", gap: 12 }}
          className="border-gray-150 shadow-soft dark:border-dark-600 dark:bg-dark-700 z-70 flex w-64 flex-col rounded-lg border bg-white transition dark:shadow-none"
        >
          {() => (
            <>
              <div className="dark:bg-dark-800 flex items-center gap-4 rounded-t-lg bg-gray-100 px-4 py-5">
                <Avatar size={14} name={username} />
                <div>
                  <div className="text-base font-medium text-gray-700 dark:text-dark-100">
                    {username}
                  </div>
                  <p className="dark:text-dark-300 mt-0.5 text-xs text-gray-400">
                    {user?.email || user?.roles?.[0]?.nombre || "Usuario"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col pt-2 pb-5">
                <div className="px-4 pt-4">
                  <Button className="w-full gap-2" onClick={logout}>
                    <ArrowLeftStartOnRectangleIcon className="size-4.5" />
                    <span>Logout</span>
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
