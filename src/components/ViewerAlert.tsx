import { Eye, Lock } from 'lucide-react';

interface ViewerAlertProps {
  isVisible: boolean;
  onClose: () => void;
  action?: string;
}

export default function ViewerAlert({ isVisible, onClose, action = 'esta ação' }: ViewerAlertProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                <Eye className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Modo Demonstração</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-50 p-2 rounded-lg">
              <Lock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Ação Bloqueada</h4>
              <p className="text-sm text-gray-600 mb-3">
                Você está usando uma conta de <strong>visualização</strong>. {action} não é permitida neste modo.
              </p>
            </div>
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
