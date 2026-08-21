import { useCallback, useState } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { useInviteUser } from "@/api/useUsers";
import type { Role } from "@/types";
import { ROLE_LABEL } from "@/constants/roles";
import styles from "./InviteUserModal.module.css";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteUserModal({ open, onClose }: InviteUserModalProps) {
  const invite = useInviteUser();
  const { isPending, isError, error, mutateAsync, reset } = invite;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "super_admin">>("security_analyst");

  const close = useCallback(() => {
    if (!isPending) {
      setName("");
      setEmail("");
      reset();
      onClose();
    }
  }, [isPending, onClose, reset]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutateAsync({ name, email, role });
    close();
  }

  return (
    <Modal open={open} onClose={close} title="Invite user" size="sm">
      <form className={styles.form} onSubmit={submit}>
        {isError && <AlertBanner tone="danger" title="Invitation failed">{error instanceof Error ? error.message : "Unable to send the invitation."}</AlertBanner>}
        <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
        <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        <Select
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as Exclude<Role, "super_admin">)}
          options={(["security_admin", "security_analyst", "viewer"] as const).map((item) => ({ value: item, label: ROLE_LABEL[item] }))}
        />
        <p className={styles.hint}>The invited user will receive an email to set their password.</p>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" loading={isPending} iconLeft="envelope">Send invitation</Button>
        </div>
      </form>
    </Modal>
  );
}
