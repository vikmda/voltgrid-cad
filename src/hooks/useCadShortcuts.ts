import { useEffect } from "react";
import { useSetAtom, useAtomValue } from "jotai"
import { undoAtom, redoAtom, canUndoAtom, canRedoAtom, viewModeAtom } from "@/store/cabinet";


export function useCadShortcuts() {
    const undo = useSetAtom(undoAtom);
    const redo = useSetAtom(redoAtom);
    const canUndo = useAtomValue(canUndoAtom);
    const canRedo = useAtomValue(canRedoAtom);
    const setViewMode = useSetAtom(viewModeAtom);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }
            const isCtrl = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();
            if (isCtrl) {
                if (key === 'z' && !e.shiftKey) {
                    if (canUndo) {
                        e.preventDefault();
                        undo();
                    }
                    return;

                }
                if (key === 'y' || key === 'z' && e.shiftKey) {
                    if (canRedo) {
                        e.preventDefault();
                        redo();
                    }
                    return;
                }
            } else {
                if (e.key === '1') {
                    e.preventDefault();
                    setViewMode('2d')
                } else if (e.key === '2') {
                    e.preventDefault();
                    setViewMode('3d')
                }

            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo, setViewMode])


}

