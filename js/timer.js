class Timer{

	constructor(interval = 1000){
		this.clock;
		this.interval = interval;
		this.isRunning;
	}
	
	start(){
		this.clock = setInterval(this.tick , this.interval);
		this.isRunning = true;
	}
	
	stop(){
		clearInterval(this.clock);
		this.isRunning = false;
	}
}