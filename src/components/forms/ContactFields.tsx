"use client";

import { CONTACT_CHANNELS } from "@/domain/labels";
import type { ContactChannel } from "@/domain/types";
import { ChoiceGroup } from "../ui/ChoiceGroup";
import { TextField } from "../ui/Field";

export function ContactFields({
  channel,
  value,
  onChannel,
  onValue,
  error,
  className,
}: {
  channel: ContactChannel;
  value: string;
  onChannel: (c: ContactChannel) => void;
  onValue: (v: string) => void;
  error?: string;
  className?: string;
}) {
  const meta = CONTACT_CHANNELS[channel];
  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        <ChoiceGroup
          legend="Как с вами связаться"
          name="contact-channel"
          variant="segments"
          value={channel}
          onChange={onChannel}
          options={(Object.keys(CONTACT_CHANNELS) as ContactChannel[]).map((c) => ({ value: c, label: CONTACT_CHANNELS[c].label }))}
        />
        <TextField
          label={meta.field}
          type={channel === "email" ? "email" : channel === "phone" ? "tel" : "text"}
          autoComplete={channel === "email" ? "email" : channel === "phone" ? "tel" : "off"}
          inputMode={channel === "phone" ? "tel" : channel === "email" ? "email" : undefined}
          placeholder={meta.placeholder}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          error={error}
        />
      </div>
    </div>
  );
}
