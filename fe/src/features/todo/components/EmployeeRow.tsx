import Avatar from 'boring-avatars';

type Props = {
  name: string;
  size?: number;
};

export default function EmployeeRow({ name, size = 22 }: Props) {
  return (
    <div className="flex items-center gap-[var(--space-2)]">
      <Avatar size={size} name={name} variant="beam" />
      <span className="text-[length:var(--text-ml)] text-[color:var(--color-text-secondary)] font-semibold leading-5">
        {name}
      </span>
    </div>
  );
}
