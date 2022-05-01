class Time{
	
	constructor(timeString = "0:0:0"){

		let timeArray = timeString.split(':');
		this.hours = parseInt(timeArray[0]);
		this.minutes = parseInt(timeArray[1]);
		this.seconds = parseInt(timeArray[2]);

	}

	inWords(){
		
		let timeInWords = '';
		
		if(this.hours !== 0){
			if(this.hours === 1) timeInWords += "1 hour";
			else timeInWords += this.hours + " hours";
		}
		if(this.minutes !== 0){
			if(this.hours !==0){
				timeInWords += " ";
				if(this.seconds !== 0) timeInWords += "and ";
			}
			if(this.minutes === 1) timeInWords += "1 minute";
			else timeInWords += this.minutes + " minutes";
		}
		if(this.seconds !== 0){
			if(!(this.hours === 0 && this.minutes == 0))timeInWords += " and ";
			if(this.seconds === 1) timeInWords += "1 second";
			else timeInWords += this.seconds + " seconds";
		}
		return timeInWords;
	}

	addHours(hours){
		this.hours += hours;
	}

	addMinutes(minutes){
		this.minutes += minutes;
		if(this.minutes > 59){
			this.hours ++;
			this.minutes -= 60;
		}
		if(this.minutes < 0){//in case user added negative minutes
			this.hours--;
			this.minutes += 60;
		}
	}

	addSeconds(seconds){
		this.seconds += seconds;
		if(this.seconds > 59){
			this.addMinutes(1);
			this.seconds -= 60;
		}
		if(this.seconds < 0){//in case user added negative seconds
			this.minutes--;
			this.seconds += 60;
		}
	}
	minus(RHS){
		let result = new Time();

		result.addHours(this.hours - RHS.hours);
		result.addMinutes(this.minutes - RHS.minutes);
		result.addSeconds(this.seconds - RHS.seconds);

		return result;
	}

	plus(RHS){
		let result = new Time();

		result.addHours(this.hours + RHS.hours);
		result.addMinutes(this.minutes + RHS.minutes);
		result.addSeconds(this.seconds + RHS.seconds);

		return result;
	}
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

	toString(format = "HHMMSS"){
		let timeString = '';
		format = format.toUpperCase();

		if(format.includes("HH")){
			if(this.hours < 10) timeString = '0' + this.hours;
			else timeString = this.hours + '';
		}
		if(format.includes("MM")){
			if(timeString.length > 0) timeString += ':';
			if(this.minutes < 10) timeString += '0' + this.minutes;
			else timeString += this.minutes;
		}
		if(format.includes("SS")){
			if(timeString.length > 0) timeString += ':';
			if(this.seconds < 10) timeString += '0' + this.seconds;
			else timeString += this.seconds;
		}

		return timeString;
	}
}