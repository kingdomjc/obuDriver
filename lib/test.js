const DataUtil = require("./DataUtil.js")
const BLEUtil = require("./BleUtil.js")


function testInit(){
  let array = DataUtil.makeC0SendData()
  console.log(DataUtil.buf2hex(array[0]))
}



function test8f(){
  let array = DataUtil.makeC5SendData("abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef123456")
  for(let i=0;i<array.length;i++){
    console.log(DataUtil.buf2hex(array[i]))
    console.log("______________________________")
  }
}

test8f()

