export function HeroTitle() {
  return (
    <>
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter">
        프<span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">딥</span>
      </h1>
      <p className="text-lg text-muted-foreground max-w-[28rem]">
        프론트엔드를 <span className="text-foreground font-normal">딥하게</span> 알자
      </p>
    </>
  );
}
