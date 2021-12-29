export default class Ratio {
	numerator: bigint;
	denominator: bigint;

	constructor(numerator=1n, denominator=1n) {
		this.numerator = numerator;
		this.denominator = denominator;
	}

	static of(a: number, b: number): Ratio {
		return new Ratio(BigInt(a), BigInt(b));
	}

	static fromFloat(float: number): Ratio {
		const dataView = new DataView(new ArrayBuffer(8));
		dataView.setFloat64(0, float);

		const bigint = dataView.getBigUint64(0);
		const sign = bigint >> 63n;
		const offsetExponent = bigint >> 52n & 0x7FFn;
		const significand = bigint & 0x000F_FFFF_FFFF_FFFFn;

		let ratio = new Ratio();
		for (let bitIndex = 1n; bitIndex <= 52n; bitIndex++) {
			if ((significand >> (52n - bitIndex) & 0b1n) === 0n) continue;
			ratio = ratio.add(new Ratio(1n, 2n ** bitIndex));
		}

		const exponent = offsetExponent - 1023n;
		if (exponent > 0n) {
			ratio = ratio.mul(new Ratio(2n ** exponent));
		} else if (exponent < 0n) {
			ratio = ratio.mul(new Ratio(1n, 2n ** -exponent));
		}

		if (sign === 1n) {
			ratio.numerator *= -1n;
		}

		return ratio;
	}

	reduced() {
		const divisor = gcd(this.numerator, this.denominator);
		return new Ratio(this.numerator / divisor, this.denominator / divisor);
	}

	add(addend: Ratio) {
		const factor = lcm(this.denominator, addend.denominator);
		return new Ratio(this.numerator * (factor / this.denominator) + addend.numerator * (factor / addend.denominator), factor);
	}

	sub(subtrahend: Ratio) {
		const factor = lcm(this.denominator, subtrahend.denominator);
		return new Ratio(this.numerator * (factor / this.denominator) - subtrahend.numerator * (factor / subtrahend.denominator), factor);
	}

	neg(): Ratio {
		return new Ratio(-this.numerator, this.denominator);
	}

	mulRaw(factor: Ratio) {
		return new Ratio(this.numerator * factor.numerator, this.denominator * factor.denominator);
	}

	mul(factor: Ratio) {
		return this.mulRaw(factor).reduced();
	}

	isZero() {
		return this.numerator === 0n;
	}

	isInfinite() {
		return this.denominator === 0n;
	}

/* 	limitDenominator(maxDenominator: bigint): Ratio {
		if (maxDenominator < 1n) throw new RangeError("denominator must be positive");

		// https://github.com/python/cpython/blob/main/Lib/fractions.py#L212
		let [lowerNum, lowerDen, upperNum, upperDen] = [0n, 1n, 1n, 0n];
		let [num, den] = [this.numerator, this.denominator];
		while (true) {
			const quotient = num / den;
			const nextDen = lowerDen + quotient * upperDen;
			if (nextDen > maxDenominator) break;

			const nextNum = lowerNum + quotient * upperNum;
			[lowerNum, lowerDen, upperNum, upperDen] = [upperNum, upperDen, nextNum, nextDen];
			[num, den] = [den, num - quotient / den];
		}

		const newDen = (maxDenominator - upperNum) / upperDen;
		// ...
	} */

	toFloat(): number {
		// TODO use a more precise method
		return Number(this.numerator) / Number(this.denominator);
	}

	toString() {
		return `${this.numerator}/${this.denominator}`;
	}
}
const abs = (number: bigint) => number < 0n ? -number : number;

const max = (a: bigint, b: bigint) => a > b ? a : b;
const min = (a: bigint, b: bigint) => a < b ? a : b;

/* const gcd = (a: bigint, b: bigint) => {
	for (let currentDivisor = min(abs(a), abs(b)); currentDivisor > 1n; currentDivisor--) {
		if (a % currentDivisor !== 0n || b % currentDivisor !== 0n) continue;
		return currentDivisor;
	}
	return 1n;
}; */

const gcd = (a: bigint, b: bigint) => {
	while (b !== 0n) {
		[a, b] = [b, a % b];
	}
	return abs(a);
};

const lcm = (a: bigint, b: bigint) => a / gcd(a, b) * b;