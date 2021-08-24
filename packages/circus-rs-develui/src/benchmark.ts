export const benchmark = (
  totalTime: number,
  fn: (progress: number) => Promise<void>
) => {
  if (totalTime <= 0) return;

  const beginTime = new Date().getTime();

  const draw = async () => {
    const frameTime = new Date().getTime();
    const progress = Math.min(1.0, (frameTime - beginTime) / totalTime);
    await fn(progress);
    if (progress < 1.0) {
      return await draw();
    } else {
      return;
    }
  };

  return draw();
};

export const drawBenchmark = async (
  viewer,
  draw: (viewer) => void,
  title: string = ''
) => {
  let frameCounter = 0;
  const ms = 10000;
  await benchmark(
    ms,
    progressRate =>
      new Promise((ok, ng) => {
        viewer.once('draw', () =>
          setTimeout(() => {
            frameCounter++;
            ok();
          }, 0)
        );
        draw(viewer);
      })
  );
  const report =
    title + ' ' + ((frameCounter / ms) * 1000).toString() + ' [fps]';
  console.log(report);
  return report;
};
