from time import perf_counter
from contextlib import contextmanager

class PerformanceTimer:
    def __init__(self):
        self.timings = {}
        self.stage_starts = {}
        self.total_start = perf_counter()

    def start_stage(self, stage_name):
        current_time = perf_counter()

        self.stage_starts[stage_name] = current_time

    def end_stage(self, stage_name):
        start_time = self.stage_starts[stage_name]

        elapsed_ms = (perf_counter() - start_time) * 1000

        self.timings[stage_name + "_ms"] = elapsed_ms

    def finish(self):
        total_time_ms = (perf_counter() - self.total_start) * 1000

        self.timings["total_time_ms"] = total_time_ms

    def get_timings(self):
        return self.timings
    
    @contextmanager
    def stage(self, stage_name):
        self.start_stage(stage_name)

        try:
            yield
        finally:
            self.end_stage(stage_name)



    


