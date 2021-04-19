import { readable, Writable, writable } from "svelte/store";
import type { ClockElementBox } from "../types";

export let activeStyle: Writable<number> = writable(0);

export let hoursBox: Writable<ClockElementBox> = writable({x: '', y: '', visible: true});
export let minutesBox: Writable<ClockElementBox> = writable({x: '', y: '', visible: true});
export let secondsBox: Writable<ClockElementBox> = writable({x: '', y: '', visible: true});