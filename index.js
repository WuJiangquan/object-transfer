;(function (name, definition) {
  // 检测上下文环境是否为AMD或CMD
  var hasDefine = typeof define === 'function',
    // 检查上下文环境是否为Node
    hasExports = typeof module !== 'undefined' && module.exports;
 
  if (hasDefine) {
    // AMD环境或CMD环境
    define(definition);
  } else if (hasExports) {
    // 定义为普通Node模块
    module.exports = definition();
  } else {
    // 将模块的执行结果挂在window变量中，在浏览器中this指向window对象
    this[name] = definition(); 
  }
})('Transfer', function () {

      var typeConvert = {
         "intType" : function(data){
             return parseInt(data);
         },
         "floatType" : function(data){
            return parseFloat(data);
         },
         "stringType" : function(data){
            return "" + data;
         },
         "booleanType" : function(data){
             if("false" === data){
                return false;
             }
             return  !!data;
         }
      }

      var mixObj = function(origin,target){
        for(var prop in target){
           if("object" == typeof target[prop]){
              origin[prop] = {};
               mixObj(origin[prop],target[prop]);
           }else{
              origin[prop] = target[prop];
           }
        }
        return origin;
      }


      //时间格式化工具
      var dateFormat = {
          getYear : function(time){
            var year = "";
            //如果是 yyyy 则返回 fullyear 类型的数据
            if(/y{4}/.test(this.yearFormat)){
                year = time.getFullYear()
            }else{
                year = (time.getYear()+"").match(/[0-9]{2}$/)[0];
            }
            return year;
          },
          getMonth : function(time){
             var month = time.getMonth() + 1;
             month = /m{2}/.test(this.monthFormat)?this.twoBitFormat(month) : month;
             return month;
          },
          getDate : function(time){
             var date = time.getDate() ;
             date = /d{2}/.test(this.dateFormat)?this.twoBitFormat(date) : date;
             return date;
          },
          getHour : function(time){
             var hour = time.getHours() ;
             hour = /H{2}|h{2}/.test(this.hourFormat)?this.twoBitFormat(hour) : hour;
             return hour;
          },
          getMin : function(time){
             var min = time.getMinutes();
             min = /M{2}/.test(this.minFormat)?this.twoBitFormat(min) : min;
             return min;
          },
          getSecond : function(time){
            var second = time.getSeconds() ;
             second = /s{2}|S{2}/.test(this.secondFormat)?this.twoBitFormat(second) : second;
             return second;
          },
          twoBitFormat : function(time){
              // 如果小于10 的数据，则在前面添加0
              if(time<10){
                return "0" + time;
              }
              return time;
          },
          format : function(date,formatStr){
              var time = new Date(date);
              this.yearFormat = formatStr.match(/y+/)
              this.monthFormat = formatStr.match(/m+/)
              this.dateFormat = formatStr.match(/d+/)
              this.hourFormat = formatStr.match(/H+|h+/)
              this.minFormat = formatStr.match(/M+/)
              this.secondFormat = formatStr.match(/S+|s+/)
              var year = this.getYear(time);
              var month = this.getMonth(time);
              var date = this.getDate(time);
              var hour = this.getHour(time);
              var min = this.getMin(time);
              var second = this.getSecond(time);
              return formatStr.replace(this.yearFormat,year)
                              .replace(this.monthFormat,month)
                              .replace(this.dateFormat,date)
                              .replace(this.hourFormat,hour)
                              .replace(this.minFormat,min)
                              .replace(this.secondFormat,second);

          }
      }


     var Convert  = function(regulation){

          var getData = function(obj,propName){
            var result = "";
            try{
               // 如果字段名带有点，则说明字段是某个属性下面的子属性，则使用递归的方式去获取子属性
               if(!/\./.test(propName)){
                 result = obj[propName];
               }else{
                  var currentProp = propName.split(".")[0]
                  var nextPropName = propName.replace(currentProp + ".","");
                  result = getData(obj[currentProp],nextPropName);
               }
            }catch(error){

            }
             return result;
         }

         this.get = function(origin,regulations){
              // 判断是否是数据类型的数据
              var isArrayType = "[object Array]" == Object.prototype.toString.call(regulations);
              var newData = isArrayType?[]:{};
              // 遍历规则的所有字段 
              for(var prop in regulations){
                 var regulation = regulations[prop];
                 var indexData = "";
                 
                 if("string" == typeof regulation){
                     // 如果规则是字符串，则去解析字符串的规则。
                     indexData = this.getByString(origin,regulation);
                 }else if("function" == typeof regulation){
                       // 如果是函数，则直接调用
                     indexData = regulation(origin,newData);
                 }else{
                      // 如果是数组获取其他方式，是用递归获取。
                     indexData = this.get(origin,regulation);
                 }
                 var index = isArrayType?parseInt(prop):prop;
                 newData[index] = indexData;
               }
               return newData;
         };

         this.getByString = function(origin,regulation){
            var regDetail = regulation.split("|");
             //先获取数据
            result = getData(origin,regDetail[0]);
            // 然后匹配规则,如果规则的长度是2 则说明时 数据类型的转换。
            // 如果规则的长度是3 ，则是更复杂的匹配方式
            switch(regDetail.length){
              case 2 : {
                 result = this.typeConvert(result,regDetail);
              }break;
              case 3 : {
                  var foamtType = regDetail[1];
                  if("function" == typeof this[foamtType]){
                      result = this[foamtType](result,regDetail)
                  }else if(/arr/.test(foamtType)){
                      //如果是数组，则获取数组元素
                      result = this.getArrayIndex(result,regDetail);
                  }else if(/\+|\-|\*|\//.test(foamtType)){
                       //如果是四则运算，则进行计算
                       result = this.getArithmetic(origin,regDetail);
                  }

              }break;
            }
            return result;
         }

       

         this.dateFormat = function(data,regulations){
              var formatReg =  regulations[2] || "yyyy-mm-dd";
              var date = dateFormat.format(data,formatReg);
              return date;
         };
          //将键值对转换成 ｛key:abc,value:abc｝ 的形式
         this.objectFormat = function(data,regulations){
              //转换后键名对应的字段名
               var keyName = regulations[2].match(/(?<=key\:)[a-zA-Z0-9_\.]+(?=\,|$)/)[0];
                //转换后键值对应的字段信息，可能将以前键值中的某个字段作为新键值
                //如 "111" : {name :"伺服器1",level : "2"}
               var valInfo = regulations[2].split(",")[1];
               var valueOriginName = valInfo.split(":")[0];
               var valueName = valInfo.split(":")[1];
               var results = [];
              for(var prop in data){
                var obj = {};
                obj[keyName] = prop;
                var value = data[prop];
                if(data[prop][valueOriginName]||/\./.test(valueOriginName)){
                    value =  getData(data[prop],valueOriginName)
                }
                obj[valueName] = value;
                results.push(obj);
              }
              if(results.length == 1 && /\.[0-9]+$/.test(regulations[0])){
                results = results[0];
              }
              return results;
         };
         this.getArrayIndex = function(data,regulations){
            var indexs = regulations[2];
            var result = [];
            if(!indexs){
              return data;
            }
            indexs = indexs.split(",")
            for(var i =0,len = indexs.length;i<len;i++) {
               result.push(data[i]||"");
            }
            return result;
         };
         this.typeConvert = function(data,regulations){
            var type = (regulations[1]||"") + "Type";
            if("function" == typeof typeConvert[type]){
               return typeConvert[type](data)
            }
            return data;
         };
         this.getArithmetic = function(data,regulations){
             var arithmeticType = regulations[1];
             var data1 = this.getByString(data,regulations[0])||"";
             var data2 = this.getByString(data,regulations[2])||"";
             if(!data1 ){
                return data2;
             }
             if(!data2){
                return data2;
             }
             switch(arithmeticType){
                case "+" :{
                  return data1 + data2;
                }break;
                case "-" : {
                    return data1 - data2;
                }break;
                 case "*" : {
                    return data1 * data2;
                }break;
                 case "/" : {
                    return data1 / data2;
                }break;
             }
         }
         


        }
    //  
    //  
    
    var appendProp = function(obj,prop,val){
       var props = prop.split(".");
       var newObj = val;
       for(var i = props.length-1;i>=0;i--){
        var currentProp =  props[i];
          if(i==0){
            if("string" ==typeof newObj){
               obj[currentProp] = newObj
            }else if("[object Array]" == Object.prototype.toString.call(newObj)){
               obj[currentProp] = [];
               mixObj(obj[currentProp],newObj);
            }else{
               if(!obj[currentProp]){
                 obj[currentProp] = {};
               }
               mixObj(obj[currentProp],newObj);
            }
           
          }else{
            var tempObj = newObj;
            newObj = {};
            newObj[currentProp] = tempObj;
          }
       }
       return obj;
    }

    var revertData = function(reg,datas){
      var result = {};
      for(var i =0,len = datas.length;i<len;i++){
        var data = datas[i];
        var keyName = reg.match(/(?<=key\:)[a-zA-Z0-9_\.]+(?=\,|$)/)[0];
        var valName = reg.match(/(?<=\:)\w*$/)[0];
        var valKey = reg.match(/(?<=\,)[\w\.]*(?=\:)/)[0];
        var key = data[keyName];
        var value = data[valName];
        if("value" != valKey){
           result[key] = {};
           appendProp(result[key],valKey,value);
        }else{
           result[key] = value;
         }
       
      }
      return result;
    }

    var ReConvert = function(){
        this.get = function(target,regulation,origin){
           var result ;
           if("string" == typeof target){
              result = "";
           }else if( "[object Array]" == Object.prototype.toString.call(target)){
              result  = [];
           }else{
               result = {};
           }
           for(var prop in regulation){
               var reg = regulation[prop];
               var data = target[prop];
               var regs =  reg.split("|");
               var len = regs.length;
               reg = regs[0]; 
               if(len == 3){
                 data = revertData(regs[2],data);
               }
               result = appendProp(result,reg,data)
           }
           return result;
        }
    }

    var reConvertable = function(regulation){
        for(var prop in regulation){
           var reg = regulation[prop];
           var len = reg.split("|").length;
           if("function" == typeof reg){
              return false;
           }
           if(len ===3 && /(\|\+\|)|(\|\-\|)|(\|\*\|)|(\|\/\|)|dateFormat/.test(reg)){
              return false;
           }
        }
        return true;
    }

    var Transfer = function(regulation){
         var me  = this;
         this.reversible  = true;
         this.conver_result = "";
         this.regulation = regulation;
         var convert = new Convert(me);
         var reConvert = new ReConvert(me);

         this.convert = function(origin){
             this.conver_result = convert.get(origin,regulation);
             return  this.conver_result;
         }



         this.reConvert = function(target){
             if(reConvertable(this.regulation)){
                return reConvert.get(target,regulation);
             }
             return "error!Can't reconvert";
         }
    }
    return Transfer;

});
