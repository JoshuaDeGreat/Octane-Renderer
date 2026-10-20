/**
 * Moves a value towards a target with a capped acceleration and speed, braking so it stops on the
 * target (AIR's stack motion, which slides the fx of a stack into their new places). Units are px and
 * ms; the time is stepped in slices of at most 8 ms so the motion does not depend on the frame rate.
 */
export class VariableFxStackMotion
{
    private static STEP_MS: number = 8;

    private _acceleration: number;
    private _deceleration: number;
    private _maxSpeed: number;
    private _epsilon: number;
    private _lastTime: number = 0;
    private _speed: number = 0;
    private _target: number = 0;
    private _value: number = 0;

    constructor(acceleration: number, maxSpeed: number, epsilon: number, deceleration: number = acceleration)
    {
        this._acceleration = Math.max(0, acceleration);
        this._deceleration = Math.max(0, deceleration);
        this._maxSpeed = Math.max(0, maxSpeed);
        this._epsilon = Math.max(0, epsilon);
    }

    /** Puts the value on `value` at once, standing still. */
    public reset(value: number, now: number): void
    {
        this._lastTime = now;
        this._speed = 0;
        this._target = value;
        this._value = value;
    }

    public setTarget(target: number, now: number): void
    {
        this.update(now);

        this._target = target;
        this._lastTime = now;

        const direction = this.direction();

        if(direction === 0)
        {
            this.snap();

            return;
        }

        // Keep the speed it had in the new direction, never more than the cap.
        this._speed = direction * Math.min(Math.abs(this._speed), this._maxSpeed);
    }

    /** Whether the value still moves, or (with `scale`) would land on another whole pixel. */
    public needsUpdate(now: number, scale: number = 0): boolean
    {
        if((scale > 0) && (Math.trunc(this._target * scale) !== Math.trunc(this._value * scale))) return true;

        return (Math.abs(this._target - this._value) > this._epsilon) || (Math.abs(this._speed) > this._epsilon);
    }

    /** Advances to `now`; true when the value moved. */
    public update(now: number): boolean
    {
        let elapsed = Math.max(0, now - this._lastTime);

        if((elapsed <= 0) || this.isSettled())
        {
            this._lastTime = now;

            return false;
        }

        const previous = this._value;

        while((elapsed > 0) && !this.isSettled())
        {
            const step = Math.min(elapsed, VariableFxStackMotion.STEP_MS);

            this.step(step);

            elapsed -= step;
        }

        this._lastTime = now;

        return (this._value !== previous);
    }

    public get value(): number
    {
        return this._value;
    }

    public get target(): number
    {
        return this._target;
    }

    private step(time: number): void
    {
        const distance = (this._target - this._value);
        const direction = Math.sign(distance);

        if((direction === 0) || (Math.abs(distance) <= this._epsilon))
        {
            this.snap();

            return;
        }

        const acceleration = this.resolveAcceleration(direction);
        const value = (this._value + (this._speed * time) + (0.5 * acceleration * time * time));
        let speed = (this._speed + (acceleration * time));

        if((Math.sign(this._target - value) !== direction) || (Math.abs(this._target - value) <= this._epsilon))
        {
            this.snap();

            return;
        }

        if((this._maxSpeed > 0) && (Math.abs(speed) > this._maxSpeed)) speed = (Math.sign(speed) * this._maxSpeed);

        if((this._speed !== 0) && (Math.sign(speed) !== Math.sign(this._speed)) && (Math.sign(acceleration) !== direction)) speed = 0;

        this._value = value;
        this._speed = speed;
    }

    private resolveAcceleration(direction: number): number
    {
        const towards = (this._speed * direction);

        // Moving away: turn around at full acceleration.
        if(towards < 0) return (direction * this._acceleration);

        // Close enough that braking now stops it on the target.
        const brakingDistance = ((this._deceleration > 0) ? ((towards * towards) / (2 * this._deceleration)) : 0);

        if(brakingDistance >= Math.abs(this._target - this._value)) return (-direction * this._deceleration);

        if(((this._maxSpeed > 0) && (towards >= this._maxSpeed)) || (this._acceleration <= 0)) return 0;

        return (direction * this._acceleration);
    }

    private direction(): number
    {
        const distance = (this._target - this._value);

        return (Math.abs(distance) <= this._epsilon) ? 0 : Math.sign(distance);
    }

    private isSettled(): boolean
    {
        return (Math.abs(this._target - this._value) <= this._epsilon) && (Math.abs(this._speed) <= this._epsilon);
    }

    private snap(): void
    {
        this._value = this._target;
        this._speed = 0;
    }
}
