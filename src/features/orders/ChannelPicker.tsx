import type { ComponentType, SVGProps } from 'react';
import { ChatIcon, PeopleIcon, PhoneIcon } from '../../components/icons';
import { SEGMENT_TRACK, segmentClass } from '../../components/styles';
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
    <div role="radiogroup" aria-label="How did the order come in?" className={SEGMENT_TRACK}>
      {CHANNELS.map(({ value: channel, label, Icon }) => {
        const selected = channel === value;
        return (
          <button
            key={channel}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(channel)}
            className={`flex h-11 flex-auto items-center justify-center gap-1.5 rounded-xl px-1 text-[15px] ${segmentClass(selected)}`}
          >
            <Icon width={18} height={18} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
