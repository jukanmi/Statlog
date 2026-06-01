import React from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  maxMembers: number;
  onMaxChange: (val: number) => void;
  tags: string[];
  onToggleTag: (tag: string) => void;
  allTags: string[];
  maxOptions: number[];
}

const CreatePartyModal: React.FC<CreatePartyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  maxMembers,
  onMaxChange,
  tags,
  onToggleTag,
  allTags,
  maxOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-[28px] w-full max-w-[360px] p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-black m-0">새 파티 만들기</h2>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors bg-transparent border-none">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1.5 block ml-1">파티 이름</label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value.slice(0, 15))}
              placeholder="멋진 파티 이름을 지어주세요"
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-[#C9A84C]/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1.5 block ml-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value.slice(0, 40))}
              placeholder="파티의 목표를 적어주세요"
              className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#C9A84C]/50 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1.5 block ml-1">정원</label>
              <select
                value={maxMembers}
                onChange={(e) => onMaxChange(Number(e.target.value))}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white outline-none appearance-none"
              >
                {maxOptions.map(n => <option key={n} value={n}>{n}명</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-1.5 block ml-1">태그 (최대 3개)</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map(tag => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all",
                      active 
                        ? "bg-[#C9A84C] border-[#C9A84C] text-[#0F0F1A]" 
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={onCreate}
          disabled={!name.trim()}
          className={cn(
            "w-full h-[56px] rounded-2xl text-base font-black mt-8 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl",
            name.trim() 
              ? "bg-[#C9A84C] text-[#0F0F1A] shadow-[#C9A84C]/20" 
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
          )}
        >
          파티 생성하기
        </button>
      </div>
    </div>
  );
};

export default CreatePartyModal;
