import { Matrix } from "./Matrix";

export enum EluerOrder{
    DEFAULT_ORDER="XYZ"
}


export class Euler {
    constructor(public x:number,public y:number,public z:number,public order=EluerOrder.DEFAULT_ORDER) {

    }

    setFromRotationMatrix(m:Matrix,order=this.order){
        
    }
}