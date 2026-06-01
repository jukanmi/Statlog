import React from 'react';
import { X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateGuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  maxMembers: number;
  onMaxChange: (val: number) => void;
  maxOptions: number[];
}

const CreateGuildModal: React.FC<CreateGuildModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  maxMembers,
  onMaxChange,
  maxOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-[32px] w-full max-w-[360px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Shield size={20} />
            </div>
            <h2 className="text-white text-xl font-black m-0">길드 창설</h2>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors bg-transparent border-none">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <label className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1.5 block ml-1">길드 이름</label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value.slice(0, 15))}
              placeholder="길드 이름을 정해주세요"
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1.5 block ml-1">길드 설명</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value.slice(0, 40))}
              placeholder="길드의 목표와 규칙을 적어주세요"
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1.5 block ml-1">최대 정원</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {maxOptions.map(n => (
                <button
                  key={n}
                  onClick={() => onMaxChange(n)}
                  className={cn(
                    "h-10 rounded-lg text-[12px] font-bold border transition-all",
                    maxMembers === n 
                      ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                  )}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onCreate}
          disabled={!name.trim()}
          className={cn(
            "w-full h-[60px] rounded-2xl text-base font-black mt-10 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl",
            name.trim() 
              ? "bg-indigo-500 text-white shadow-indigo-500/20" 
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
          )}
        >
          길드 창설하기
        </button>
      </div>
    </div>
  );
};

export default CreateGuildModal;
