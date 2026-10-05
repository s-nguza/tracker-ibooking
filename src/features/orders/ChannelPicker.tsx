import type { ComponentType, SVGProps } from 'react';
import { ChatIcon, PeopleIcon, PhoneIcon } from '../../components/icons';
import type { OrderChannel } from '../../domain/orders';

const CHANNELS: {
  value: OrderChannel;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { value: 'call', label: 'Call', Icon: PhoneIcon },
  { value: 'whatsapp', label: 'WhatsApp', Icon: ChatIcon },
  { value: 'walk-in', label: 'Walk-in', Icon: PeopleIcon },
];

interface ChannelPickerProps {
  value: OrderChannel;
  onChange: (channel: OrderChannel) => void;
}

export function ChannelPicker({ value, onChange }: ChannelPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="How did the order come in?"
      className="grid grid-cols-3 gap-2"
    >
      {CHANNELS.map(({ value: channel, label, Icon }) => {
        const selected = channel === value;
        return (
          <button
            key={channel}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(channel)}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-base transition-colors ${
              selected
                ? 'border-brand-600 bg-brand-600 font-semibold text-white'
                : 'hover:border-brand-300 border-stone-200 bg-white text-stone-700'
            }`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </div>
  );
}
