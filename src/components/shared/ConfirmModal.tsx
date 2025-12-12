// Import Dependencies
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import merge from "lodash/merge";
import { ElementType, useRef, useState, useEffect } from "react";

// Local Imports
import { Button, GhostSpinner } from "@/components/ui";
import { AnimatedTick } from "./AnimatedTick";

// ----------------------------------------------------------------------

export type ModalState = "pending" | "success" | "error";

interface MessageConfig {
  Icon: ElementType;
  iconClassName?: string;
  title: string;
  description: string;
  actionText: string;
}

interface Messages {
  pending: MessageConfig;
  success: MessageConfig;
  error: MessageConfig;
}

export interface ConfirmProps {
  onOk: () => void;
  onClose: () => void;
  state: ModalState;
  messages?: ConfirmMessages;
  confirmLoading?: boolean;
}

export type ConfirmMessages = {
  [K in ModalState]?: Partial<MessageConfig>;
};

const defaultMessages: Messages = {
  pending: {
    Icon: ExclamationTriangleIcon,
    iconClassName: "text-warning",
    title: "Are you sure?",
    description:
      "Are you sure you want to delete this record? Once deleted, it cannot be restored.",
    actionText: "Delete",
  },
  success: {
    Icon: AnimatedTick,
    iconClassName: "text-success",
    title: "Record Deleted",
    description: "You have successfully deleted the record from the database.",
    actionText: "Done",
  },
  error: {
    Icon: XCircleIcon,
    title: "Opps... Something failed.",
    description:
      "Ensure internet is on and retry. Contact support if issue remains.",
    actionText: "Retry",
    iconClassName: "text-error",
  },
};

export function ConfirmModal({
  show,
  onClose,
  onOk,
  confirmLoading,
  className,
  state,
  messages,
}: ConfirmProps & { show: boolean; className?: string }) {
  const focusRef = useRef<HTMLButtonElement>(null);

  const dialogProps = confirmLoading
    ? {
        onClose: () => {},
        static: true,
      }
    : {
        onClose,
      };

  return (
    <Transition
      appear
      show={show}
      as={Dialog}
      initialFocus={focusRef}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
      {...dialogProps}
    >
      <TransitionChild
        as="div"
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
      />

      <TransitionChild
        as={DialogPanel}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className={clsx(
          "scrollbar-sm relative flex w-full max-w-md flex-col overflow-y-auto rounded-lg bg-white px-4 py-6 text-center transition-opacity duration-300 dark:bg-dark-700 sm:px-5",
          className,
        )}
      >
        <Confirm
          {...{
            onOk,
            state,
            messages,
            confirmLoading,
            onClose,
            focusRef,
            show,
          }}
        />
      </TransitionChild>
    </Transition>
  );
}

function Confirm({
  onOk,
  state,
  messages,
  confirmLoading,
  onClose,
  focusRef,
  show,
}: ConfirmProps & { focusRef: React.RefObject<HTMLButtonElement | null>; show: boolean }) {
  const mergedMessages = merge(defaultMessages, messages);
  // Mantener el último estado visible durante la animación de cierre
  const [displayState, setDisplayState] = useState<ModalState>(state);

  useEffect(() => {
    if (show) {
      // Cuando el modal se muestra, actualizar el estado de visualización
      setDisplayState(state);
    } else if (state === "pending" && displayState !== "pending") {
      // Si el modal se está cerrando y el estado cambió a pending,
      // mantener el último estado visible durante la animación
      // No hacer nada, mantener displayState
    } else {
      // Si el modal está cerrado, actualizar el estado
      setDisplayState(state);
    }
  }, [state, show, displayState]);

  const Icon = mergedMessages[displayState].Icon;
  const spinner = <GhostSpinner variant="soft" className="size-4 border-2" />;

  return (
    <>
      <Icon
        className={clsx(
          "mx-auto size-24 shrink-0",
          mergedMessages[displayState].iconClassName,
        )}
      />
      <div className="mt-4">
        <h3 className="text-xl text-gray-800 dark:text-dark-100">
          {mergedMessages[displayState].title}
        </h3>
        <p className="mx-auto mt-2 max-w-xs">
          {mergedMessages[displayState].description}
        </p>

        {displayState === "success" ? (
          <Button
            onClick={onClose}
            color="success"
            className="mt-12 h-9 min-w-[7rem]"
          >
            {mergedMessages[displayState].actionText}
          </Button>
        ) : displayState === "error" ? (
          <Button
            onClick={onClose}
            variant="outlined"
            className="mt-12 h-9 min-w-[7rem]"
          >
            Cerrar
          </Button>
        ) : (
          <div className="mt-12 flex justify-center space-x-3 rtl:space-x-reverse">
            <Button
              onClick={onClose}
              variant="outlined"
              className="h-9 min-w-[7rem]"
            >
              Cancel
            </Button>

            {displayState === "pending" && (
              <Button
                ref={focusRef}
                onClick={onOk}
                color="primary"
                className="h-9 min-w-[7rem] space-x-2 rtl:space-x-reverse"
              >
                {confirmLoading && spinner}
                <span> {mergedMessages[displayState].actionText}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
