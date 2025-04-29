import Modal from "../ui/modal";
import useWalletConnectStore from "../../store/walletConnect";
import Divider from "../ui/divider";
import Button from "../ui/button";

export function WalletConnect() {
  const { showWalletModal, setShowWalletModal } = useWalletConnectStore();

  return (
    <Modal
      open={showWalletModal}
      onClose={() => {
        setShowWalletModal(false);
      }}
    >
      <div className="bg-white w-1/4 h-auto p-4 rounded-lg flex items-center flex-col gap-4">
        <div className=" w-full flex flex-col gap-4">
          <h2 className=" text-2xl text-gray-800 text-center">Login</h2>
          <Divider />
          <Button
            onClick={() => {
              setShowWalletModal(false);
            }}
            text="Connect using Email"
          />

          <p className="text-center font-bold">OR</p>

          <div className="flex flex-col w-full gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowWalletModal(false);
              }}
              text="Argent"
            />
            <Button
              variant="secondary"
              onClick={() => {
                setShowWalletModal(false);
              }}
              text="Braavos"
            />
            <Button
              variant="secondary"
              onClick={() => {
                setShowWalletModal(false);
              }}
              text="Argent Mobile"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
