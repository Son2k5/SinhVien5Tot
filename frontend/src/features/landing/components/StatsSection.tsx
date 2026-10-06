import { landingStats } from './landingData';

export function StatsSection() {
  return (
    <section
      id="stats"
      className={`relative z-[3] p-[25px_0] text-white bg-[linear-gradient(105deg,_#0785f4,_#13a2f5_58%,_#45c4ff)] shadow-[0_18px_45px_rgba(8,132,236,.2)]`}
    >
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] grid grid-cols-[repeat(4,_1fr)] [&>div]:grid [&>div]:justify-items-center [&>div]:gap-[4px] [&>div]:border-r [&>div]:border-r-[rgba(255,255,255,.18)] [&>div:last-child]:border-0 [&_strong]:font-['Be_Vietnam_Pro',_sans-serif] [&_strong]:text-[26px] [&_span]:text-[rgba(255,255,255,.7)] [&_span]:text-[9px] [&_span]:font-semibold max-[580px]:grid-cols-[repeat(2,1fr)] max-[580px]:gap-[20px_0] max-[580px]:[&>div:nth-child(2)]:border-0 max-[580px]:[&_strong]:text-[22px] max-[420px]:gap-[17px_0] max-[420px]:[&_strong]:text-[20px] max-[420px]:[&_span]:text-[8px]`}>
        {landingStats.map((item) => (
          <div key={item.label} data-reveal>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
