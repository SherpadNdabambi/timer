class Time{

	#hours;
	#minutes;
	#seconds;

	/**
	 * 
	 * @param {string} timeString "HH:MM:SS"
	 */
	constructor(timeString = "0:0:0"){

		let timeArray = timeString.split(':');
		this.#hours = parseInt(timeArray[0]);
		this.#minutes = parseInt(timeArray[1]);
		this.#seconds = parseInt(timeArray[2]);

	}

	/**
	 * 
	 * @returns {int} number of hours
	 */
	getHours() {
		return this.#hours;
	}

	/**
	 * 
	 * @returns {int} number of minutes
	 */
	 getMinutes() {
		return this.#minutes;
	}

	/**
	 * 
	 * @returns {int} number of seconds
	 */
	 getSeconds() {
		return this.#seconds;
	}

	/**
	 * @returns {string} time in words
	 */
	inWords(){
		
		let timeInWords = '';
		
		if(this.#hours !== 0){
			if(this.#hours === 1) timeInWords += "1 hour";
			else timeInWords += this.#hours + " hours";
		}
		if(this.#minutes !== 0){
			if(this.#hours !==0){
				timeInWords += " ";
				if(this.#seconds !== 0) timeInWords += "and ";
			}
			if(this.#minutes === 1) timeInWords += "1 minute";
			else timeInWords += this.#minutes + " minutes";
		}
		if(this.#seconds !== 0){
			if(!(this.#hours === 0 && this.#minutes === 0))timeInWords += " and ";
			if(this.#seconds === 1) timeInWords += "1 second";
			else timeInWords += this.#seconds + " seconds";
		}
		return timeInWords;
	}

	/**
	 * 
	 * @param {int} hours
	 */
	addHours(hours){
		this.#hours += hours;
	}

	/**
	 * 
	 * @param {int} minutes
	 */
	addMinutes(minutes){
		this.#minutes += minutes;
		if(this.#minutes > 59){
			this.#hours ++;
			this.#minutes -= 60;
		}
		if(this.#minutes < 0){//in case user added negative minutes
			this.#hours--;
			this.#minutes += 60;
		}
	}

	/**
	 * 
	 * @param {int} seconds
	 */
	addSeconds(seconds){
		this.#seconds += seconds;
		if(this.#seconds > 59){
			this.addMinutes(1);
			this.#seconds -= 60;
		}
		if(this.#seconds < 0){//in case user added negative seconds
			this.#minutes--;
			this.#seconds += 60;
		}
	}

	/**
	 * 
	 * @param {Time} RHS
	 * @returns {Time} difference between two times
	 */
	minus(RHS){
		let result = new Time();

		result.addHours(this.#hours - RHS.hours);
		result.addMinutes(this.#minutes - RHS.minutes);
		result.addSeconds(this.#seconds - RHS.seconds);

		return result;
	}

	/**
	 * 
	 * @param {Time} RHS
	 * @returns {Time} sum of two times
	 */
	 plus(RHS){
		let result = new Time();

		result.addHours(this.#hours + RHS.hours);
		result.addMinutes(this.#minutes + RHS.minutes);
		result.addSeconds(this.#seconds + RHS.seconds);

		return result;
	}

	/**
	 * 
	 * @param {int} multiplier 
	 * @returns {Time} the product of multiplying a Time by a scalar value
	 */
	times(multiplier){

		if(multiplier === 0) return new Time();

		let result = new Time(this.toString());
		if(multiplier < 0){
			multiplier = -multiplier;
			result.hours = -result.hours;
			result.minutes = -result.minutes;
			result.seconds = -result.seconds;
		}
		for(let i = 1; i < multiplier; i++) result = result.plus(this);

		return result;
	}

	/**
	 * 
	 * @param {string} format
	 * @returns {string} time in words
	 */
	toString(format = "HHMMSS"){

		let timeString = '';
		format = format.toUpperCase();

		if(format.includes("HH")){
			if(this.#hours < 10) timeString = '0' + this.#hours;
			else timeString = this.#hours + '';
		}
		if(format.includes("MM")){
			if(timeString.length > 0) timeString += ':';
			if(this.#minutes < 10) timeString += '0' + this.#minutes;
			else timeString += this.#minutes;
		}
		if(format.includes("SS")){
			if(timeString.length > 0) timeString += ':';
			if(this.#seconds < 10) timeString += '0' + this.#seconds;
			else timeString += this.#seconds;
		}

		return timeString;
	}
}