import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import { rotateAroundYAxis } from '@utrad-ical/circus-rs/src/browser/section-util';
import { ViewerFrame } from './RsViewer5';

type ReportData = {
  error: string;
} | {
  average: number;
  stddev: number;
  fps: number;
}
const createReporter = () => {
  const startTimes: number[] = [];
  const finishTimes: number[] = [];

  const lapStart = () => {
    startTimes.push(new Date().getTime());
  }

  const lapFinish = () => {
    finishTimes.push(new Date().getTime());
  }

  const createReport = (): ReportData => {
    if (startTimes.length === 0 || finishTimes.length === 0) return { error: 'Nothing to report' };
    if (startTimes.length !== finishTimes.length) return { error: 'Broken data' };

    const renderTimes = finishTimes.reduce<number[]>(
      (times, finish, i) => [...times, finish - startTimes[i]],
      []
    );
    const average = renderTimes.reduce<number>((ttl, v) => ttl + v, 0) / renderTimes.length;
    const stddev = Math.sqrt(
      renderTimes.map(t => (t - average) ** 2).reduce((ttl, v) => ttl + v, 0) / renderTimes.length
    );
    const fps = 1000 / average;

    return { average, stddev, fps };
  }

  const flush = () => {
    startTimes.splice(0, startTimes.length);
    finishTimes.splice(0, finishTimes.length);
  }

  return { lapStart, lapFinish, createReport, flush };
}
type Reporter = ReturnType<typeof createReporter>;

export interface ViewerBenchmarkProps {
  composition?: rs.Composition;
  initialState?: rs.ViewState;
  className?: string;
}

const ImageSourceBenchmark: React.FC<ViewerBenchmarkProps> = props => {
  const { composition, initialState } = props;

  const reporter = React.useMemo(() => createReporter(), []);
  const [benchmark, setBenchmark] = React.useState<string>('');
  const [report, setReport] = React.useState<ReportData>();
  const handleBenchmarkCompleted = React.useCallback(
    () => {
      setReport(reporter.createReport());
      setBenchmark('');
      reporter.flush();
    },
    [reporter]
  );

  const handleStart = React.useCallback(() => {
    setReport(undefined);
    setBenchmark('rotation');
  }, []);

  return (
    <div>
      <div className="row">
        <div className="col-6">
          <ViewerFrame rw={512} rh={512} composition={composition}>
            <BenchmarkViewer
              composition={composition}
              initialState={initialState}
              benchmark={benchmark}
              reporter={reporter}
              onBenchmarkCompleted={handleBenchmarkCompleted}
            />
          </ViewerFrame>
        </div>
        <div className="col-6">
          <button className="btn btn-secondary" onClick={_ev => handleStart()}>START</button>
          <hr />
          <BenchmarkReport report={report} />
        </div>
      </div>
    </div>
  )
}

const BenchmarkViewer: React.FC<ViewerBenchmarkProps & {
  reporter: Reporter;
  onBenchmarkCompleted?: () => void;
  benchmark: string;
}> = props => {
  const { composition, initialState, benchmark, className, reporter, onBenchmarkCompleted = () => { } } = props;

  const [viewer, setViewer] = useState<rs.Viewer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewer = new rs.Viewer(containerRef.current!);
    setViewer(viewer);
    viewer.on('imageReady', () => {
      viewer.setState(initialState);
    });
    return () => {
      viewer.dispose();
    };
  }, [composition]);

  useEffect(() => {
    if (!viewer || !composition) return;
    if (viewer.getComposition() === composition) return;
    viewer.setComposition(composition);
  }, [viewer, composition]);

  // benchmark
  useEffect(() => {
    if (!benchmark) return;

    const initialState = viewer.getState();
    const benchmarkStates: rs.ViewState[] = [];
    for (let i = 0; i < 72; i++) {
      benchmarkStates.push({
        ...initialState,
        section: rotateAroundYAxis(initialState.section, i * 5)
      });
    }
    benchmarkStates.push(initialState);

    const postDrawHandler = async () => {
      reporter.lapFinish();

      // For some reason, if I don't do this, a webgl image source doesn't draw properly.
      await new Promise<void>(_ => setTimeout(() => _(), 0));

      const nextState = benchmarkStates.shift();
      if (nextState) {
        reporter.lapStart();
        viewer.setState(nextState);
      } else {
        viewer.removeListener('draw', postDrawHandler);
        onBenchmarkCompleted();
      }
    };
    viewer.on('draw', postDrawHandler);

    reporter.lapStart();
    viewer.setState({ ...initialState });

  }, [viewer, benchmark, onBenchmarkCompleted]);

  return (
    <div className={classnames('image-viewer', className)} ref={containerRef} />
  );
};

const BenchmarkReport: React.FC<{
  report?: ReportData;
}> = props => {
  const { report } = props;

  if (!report) return null;

  if ('error' in report) {
    return <pre>{report.error}</pre>;
  }

  const { average, stddev, fps } = report;

  return (
    <div>
      <div className="row">
        <span className="col-2">Ave</span>
        <span className="col-auto text-right">{average.toFixed(2)} [ms]</span>
      </div>
      <div className="row">
        <span className="col-2">StdDev</span>
        <span className="col-auto text-right">{stddev.toFixed(2)} [ms]</span>
      </div>
      <div className="row">
        <span className="col-2">FPS</span>
        <span className="col-auto text-right">{fps.toFixed(2)} [fps]</span>
      </div>
    </div>
  )
}

export default ImageSourceBenchmark;
