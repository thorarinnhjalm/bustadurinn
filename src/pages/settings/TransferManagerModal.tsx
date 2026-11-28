import { useId } from 'react';
import Modal from '@/components/ui/Modal';
import type { MembershipController } from './useMembershipActions';

interface TransferManagerModalProps {
    membership: MembershipController;
}

/** Confirmation modal for handing the manager role to another owner (typed "SAMÞYKKJA"). */
export default function TransferManagerModal({ membership }: TransferManagerModalProps) {
    const baseId = useId();
    const {
        memberToTransfer,
        transferConfirmation,
        setTransferConfirmation,
        transferBusy,
        closeTransferModal,
        handleTransferOwnership,
    } = membership;

    return (
        <>
            {/* Ownership Transfer Modal */}
            {
                memberToTransfer && (
                    <Modal
                        open
                        onClose={closeTransferModal}
                        title="Flytja Eignarhald?"
                        size="md"
                        dismissible={!transferBusy}
                        footer={
                            <>
                                <button
                                    type="button"
                                    onClick={closeTransferModal}
                                    disabled={transferBusy}
                                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md text-sm font-medium transition-colors"
                                >
                                    Hætta við
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTransferOwnership}
                                    disabled={transferConfirmation !== 'SAMÞYKKJA' || transferBusy}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Staðfesta Flutning
                                </button>
                            </>
                        }
                    >
                        <div>
                            <p className="text-stone-600 mb-4 text-sm leading-relaxed">
                                Þú ert að fara að gera <strong>{memberToTransfer.name || memberToTransfer.email}</strong> að umsjónarmanni hússins.
                            </p>

                            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-800">
                                <strong>Aðvörun:</strong> Þú munt missa umsjónarréttindi (húsupplýsingar, stillingar, o.fl.) og verður venjulegur meðeigandi.
                            </div>

                            <label htmlFor={`${baseId}-transfer-confirm`} className="block text-xs text-stone-500 mb-2 uppercase font-bold tracking-wide">
                                Skrifaðu "SAMÞYKKJA" til að staðfesta:
                            </label>

                            <input
                                id={`${baseId}-transfer-confirm`}
                                type="text"
                                className="w-full border border-stone-300 rounded-md px-3 py-2 font-mono text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                                placeholder="SAMÞYKKJA"
                                value={transferConfirmation}
                                onChange={(e) => setTransferConfirmation(e.target.value.toUpperCase())}
                                autoComplete="off"
                            />
                        </div>
                    </Modal>
                )
            }
        </>
    );
}
