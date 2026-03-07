type InfoSectionProps = {
  title: string;
  paragraph1: string;
  paragraph2: string;
};

export function InfoSection({ title, paragraph1, paragraph2 }: InfoSectionProps) {
  return (
    <section className="panel info-panel">
      <h2>{title}</h2>
      <p>{paragraph1}</p>
      <p>{paragraph2}</p>
    </section>
  );
}
