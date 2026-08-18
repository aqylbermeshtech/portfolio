import Scramble from "@/components/Scramble";
import CopyEmail from "@/components/CopyEmail";

const externalLinks = [
  { label: "github", href: "https://github.com/aqylbermeshtech" },
  {
    label: "linkedin",
    href: "https://www.linkedin.com/in/nurtore-kambar-b66732313/",
  },
];

const linkClass =
  "underline decoration-border underline-offset-4 hover:decoration-foreground";

export default function Home() {
  return (
    <section className="flex flex-col font-mono text-sm leading-6">
      <h1 className="text-base font-bold">
        <Scramble text="noorturin" delay={0} />
        <span className="cursor-blink ml-0.5">_</span>
      </h1>
      <p className="text-muted">
        <Scramble text="software engineer" delay={80} />
      </p>

      <h2 className="mt-10 font-bold">
        <Scramble text="about" delay={200} />
      </h2>
      <p>
        <Scramble text="junior computer science student at " delay={280} />
        <a
          href="https://sdu.edu.kz/"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <Scramble text="sdu.kz" delay={280} replayOnHover />
        </a>
        <Scramble text=", incoming swe intern at " delay={280} />
        <a
          href="https://yandex.com"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <Scramble text="yandex" delay={280} replayOnHover />
        </a>
        <Scramble text="." delay={280} />
      </p>

      <h2 className="mt-6 font-bold">
        <Scramble text="experience/achievements" delay={420} />
      </h2>
      <p>
        <Scramble text="apprenticeship at " delay={500} />
        <a
          href="https://devhouse.kz"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <Scramble text="devhouse.kz" delay={500} replayOnHover />
        </a>
        <Scramble text=", 3rd place at icpc quarterfinals." delay={500} />
      </p>

      <h2 className="mt-6 font-bold">
        <Scramble text="tech stack" delay={640} />
      </h2>
      <p>
        <Scramble text="python, c++, java, js, swift, etc." delay={720} />
      </p>

      <h2 className="mt-10 font-bold">
        <Scramble text="links" delay={860} />
      </h2>
      <ul>
        {externalLinks.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <Scramble text={link.label} replayOnHover />
            </a>
          </li>
        ))}
        <li>
          <CopyEmail email="serikovichnurture@gmail.com" />
        </li>
      </ul>
    </section>
  );
}
