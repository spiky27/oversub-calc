import tkinter as tk
from tkinter import ttk

from solver import ALL_VARS, EDITABLE, optimize_counts, solve_state

LABELS = {
    'Ds': 'Downlink speed (Gbps)',
    'Dc': 'Downlink count',
    'Us': 'Uplink speed (Gbps)',
    'Uc': 'Uplink count',
    'Tp': 'Total ports',
    'R': 'Oversub ratio (:1)',
    'DB': 'Downlink bandwidth (Gbps)',
    'UB': 'Uplink bandwidth (Gbps)',
}

ALLOCATOR_INPUTS = ['N', 'R', 'Us', 'Ds']
ALLOCATOR_LABELS = {
    'N': 'Total ports (N)',
    'R': 'Target oversub ratio (:1)',
    'Us': 'Uplink speed (Gbps)',
    'Ds': 'Downlink speed (Gbps)',
}


def format_value(v):
    if v is None:
        return ''
    rounded = round(v, 6)
    return str(int(rounded)) if rounded == int(rounded) else str(rounded)


class App:
    def __init__(self, root):
        self.value = {k: None for k in ALL_VARS}
        self.locked = {k: False for k in ALL_VARS}
        self.vars = {}
        self.entries = {}
        self.status_labels = {}
        self._suspend = False

        frame = ttk.Frame(root, padding=16)
        frame.grid(row=0, column=0, sticky='nsew')

        for i, key in enumerate(ALL_VARS):
            ttk.Label(frame, text=LABELS[key]).grid(row=i, column=0, sticky='w', pady=4)

            var = tk.StringVar()
            self.vars[key] = var
            entry = ttk.Entry(frame, textvariable=var, width=14)
            if key not in EDITABLE:
                entry.state(['disabled'])
            entry.grid(row=i, column=1, padx=8, pady=4)
            self.entries[key] = entry

            status = ttk.Label(frame, text='', width=10, foreground='gray')
            status.grid(row=i, column=2, sticky='w')
            self.status_labels[key] = status

            if key in EDITABLE:
                var.trace_add('write', lambda *_args, k=key: self.on_change(k))

        self.conflict_label = ttk.Label(frame, text='', foreground='red', wraplength=320)
        self.conflict_label.grid(row=len(ALL_VARS), column=0, columnspan=3, sticky='w', pady=(12, 0))

        self.solve()

    def on_change(self, key):
        if self._suspend:
            return
        raw = self.vars[key].get()
        if raw == '':
            self.locked[key] = False
            self.value[key] = None
        else:
            try:
                self.value[key] = float(raw)
                self.locked[key] = True
            except ValueError:
                return
        self.solve()

    def solve(self):
        result, conflicts = solve_state(self.value, self.locked)
        self.value = result
        self.render(conflicts)

    def render(self, conflicts):
        self._suspend = True
        for key in ALL_VARS:
            v = self.value[key]
            self.vars[key].set(format_value(v))

            status = self.status_labels[key]
            if key in EDITABLE:
                if self.locked[key]:
                    status.config(text='entered', foreground='#0071e3')
                elif v is not None:
                    status.config(text='derived', foreground='gray')
                else:
                    status.config(text='')
            else:
                status.config(text='derived', foreground='gray')
        self._suspend = False

        self.conflict_label.config(text=('⚠ ' + ' '.join(conflicts)) if conflicts else '')


class AllocatorApp:
    def __init__(self, root):
        self.vars = {}
        self.result_vars = {'Uc': tk.StringVar(), 'Dc': tk.StringVar(), 'actualR': tk.StringVar()}

        frame = ttk.Frame(root, padding=16)
        frame.grid(row=0, column=0, sticky='nsew')

        ttk.Label(frame, text='Inputs', font=('TkDefaultFont', 10, 'bold')).grid(
            row=0, column=0, columnspan=2, sticky='w', pady=(0, 8)
        )
        for i, key in enumerate(ALLOCATOR_INPUTS, start=1):
            ttk.Label(frame, text=ALLOCATOR_LABELS[key]).grid(row=i, column=0, sticky='w', pady=4)
            var = tk.StringVar()
            self.vars[key] = var
            entry = ttk.Entry(frame, textvariable=var, width=14)
            entry.grid(row=i, column=1, padx=8, pady=4)
            var.trace_add('write', lambda *_args: self.solve())

        result_row = len(ALLOCATOR_INPUTS) + 1
        ttk.Label(frame, text='Result', font=('TkDefaultFont', 10, 'bold')).grid(
            row=result_row, column=0, columnspan=2, sticky='w', pady=(16, 8)
        )
        ttk.Label(frame, text='Uplinks').grid(row=result_row + 1, column=0, sticky='w', pady=4)
        ttk.Entry(frame, textvariable=self.result_vars['Uc'], width=14, state='disabled').grid(
            row=result_row + 1, column=1, padx=8, pady=4
        )
        ttk.Label(frame, text='Downlinks').grid(row=result_row + 2, column=0, sticky='w', pady=4)
        ttk.Entry(frame, textvariable=self.result_vars['Dc'], width=14, state='disabled').grid(
            row=result_row + 2, column=1, padx=8, pady=4
        )
        ttk.Label(frame, text='Actual ratio').grid(row=result_row + 3, column=0, sticky='w', pady=4)
        ttk.Entry(frame, textvariable=self.result_vars['actualR'], width=14, state='disabled').grid(
            row=result_row + 3, column=1, padx=8, pady=4
        )

        self.msg_label = ttk.Label(frame, text='', foreground='red', wraplength=320)
        self.msg_label.grid(row=result_row + 4, column=0, columnspan=2, sticky='w', pady=(12, 0))

        self.solve()

    def solve(self):
        raw = {k: self.vars[k].get() for k in ALLOCATOR_INPUTS}
        if any(v == '' for v in raw.values()):
            for rv in self.result_vars.values():
                rv.set('')
            self.msg_label.config(text='')
            return

        try:
            N, R, Us, Ds = (float(raw[k]) for k in ALLOCATOR_INPUTS)
        except ValueError:
            return

        result = optimize_counts(N, R, Us, Ds)
        if result is None:
            for rv in self.result_vars.values():
                rv.set('')
            self.msg_label.config(text='⚠ Enter positive N/Us/Ds and a non-negative ratio.')
            return

        self.result_vars['Uc'].set(format_value(result['Uc']))
        self.result_vars['Dc'].set(format_value(result['Dc']))
        self.result_vars['actualR'].set(f"{round(result['actualR'], 2)} : 1")
        self.msg_label.config(text='')


if __name__ == '__main__':
    root = tk.Tk()
    root.title('Oversubscription Calculator')
    notebook = ttk.Notebook(root)
    notebook.grid(row=0, column=0, sticky='nsew')

    solver_tab = ttk.Frame(notebook)
    allocator_tab = ttk.Frame(notebook)
    notebook.add(solver_tab, text='Free-form solver')
    notebook.add(allocator_tab, text='Optimal allocator')

    App(solver_tab)
    AllocatorApp(allocator_tab)

    root.mainloop()
