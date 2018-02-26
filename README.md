**object-transfer** 
是一个用于对象字段转换的适配器，主要目的适用于 客户端数据表和 服务器端的API 之间的解耦。

当浏览器端预先定义好的数据表与服务器提供的API 字段不一致的时候，通常需要修改多个地方，提升了修改的难度。
为了降低这种耦合，只需要在数据的源头使用该适配器去做数据的转换。

当然，该适配器也可以用于一搬的对象之间的转换。

# install

```
npm install object-transfer --save-dev
```

# import
## es6

```
import Transfer from "object-transfer"
```

## amd

```
require(["object-transfer"],function(Transfer){
   
)
```
common.js


## amd

```
var Transfer = require("object-transfer")
```
# usage
### 初始化对象
定义适配的规则，并且创建适配器对象

```
var transfer = new Transfer({
   name : "USER_NAME",
   id : "USERINFO.ID|int",
   birthDate  : "USERINFO.BIRTHDATE",
   server : "SERVERS|objectFormat|key:name,value:id",
   role : "ROLES|objectFormat|key:name,info.id:id",
 });
```
### convert
调用convert API 进行数据转换
```
transfer.convert({
 	 USER_NAME : "张三丰",
 	 USERINFO : {
 	 	ID : "001",
        BIRTHDATE : "12-20"
 	 },
 	 SERVERS : {
 	 	"伺服器A"  : "111",
 	 	"伺服器B" : "112"
 	 },
 	 ROLES : {
 	 	"角色A"  : {
 	 		info : {
                id : "112"
            }
 	 	},
 	 	"角色B"  : {
          info : {
             id : "112"
          }
 	 	}
 	 }
 });
```
### 转换结果

```
{
  "name":"张三丰",
  "id":1,"birthDate":"12-20",
  "server":[{
      "name":"伺服器A",
      "id":"111"
    },
    {
      "name":"伺服器B",
      "id":"112"
  }],
  "role":[{
    "name":"角色A",
    "id":"112"
  },{
    "name":"角色B",
    "id":"112"
  }]
}  
```

### reConvert
调用reConvert 可以执行逆转换

```
transfer.reConvert({
  "name":"张三丰",
  "id":1,
  "birthDate":"12-20",
  "server":[{
      "name":"伺服器A",
      "id":"111"
    },
    {
      "name":"伺服器B",
      "id":"112"
   }],
  "role":[{
    "name":"角色A",
    "id":"112"
   },{
    "name":"角色B",
    "id":"112"
   }]
 })
```
### 逆转换结果

```
{
  USER_NAME:"张三丰",
  USERINFO:{
    ID:1,
    BIRTHDATE:"12-20"
  },
  SERVERS:{
     "伺服器A":"111",
     "伺服器B":"112"
  },
  ROLES:{
    "角色A":{
       info:{
          id:"112"
        }
     },
     "角色B":{
       info:{
          id:"112"
       }
     }
  }
}
```

# 更复杂的转换
适配器可以做更复杂的转换，但是复杂的规则，==无法实现逆转换==

###  获取数组元素
无法逆转换
```
var transfer = new Transfer({
    gift : "GIFTS|arr|1,3"
 });
 var newData = transfer.convert({
       GIFTS : [{
           name : "宝石"
       },{
         name : "黄金"
       },{
         name : "砖石"
       }]
 });
 /* 
 {"gift":[{
       name : "宝石"
   },{
     name : "砖石"
 }]}
*/
```
### 获取数组元素的子属性
无法逆转换
```
var transfer = new Transfer({
    gift : ["GIFTS.0.name","GIFTS.2.name"]
 });
 var newData = transfer.convert({
       GIFTS : [{
           name : "宝石"
       },{
         name : "黄金"
       },{
         name : "砖石"
       }]
 });
 // {"gift":["宝石","砖石"]}
```
### 获取数组元素 与 objectFormat 搭配使用
无法逆转换

```
var transfer = new Transfer({
    gift : ["GIFTS.0|objectFormat|key:id,value:name","GIFTS.2|objectFormat|key:id,value:name"],
 });
 var newData = transfer.convert({
       GIFTS : [{
           "123" : "宝石"
       },{
         "124" : "黄金"
       },{
         "125" : "砖石"
       }]
 });

 //{gift:[{id:123,name:宝石},{id:"125",name:"砖石"}]}
```


### 类型转换 以及 插入函数进行转换方式
无法逆转换

```
var transfer = new Transfer({
    gift : ["GIFTS.0.name","GIFTS.2.name"],
    roles : {
         name : "ROLE.NAME",
         id : "ROLE.ID"
    },
    ring : "RING|int",
    height: "HEIGHT|float",
    secondName : "SECOND_NAME|string",
    isVip : "is_vip|boolean",
    fullName : "FIST_NAME|+|LAST_NAME",
    price : "price|*|discount",
    discount : "newPrice|/|originPrice",
    month : "month|-|1",
    other: function(data,context){
        return  data.HEIGHT + context.height
    }
 });
 var newData = transfer.convert({
       FIST_NAME : "张",
       LAST_NAME : "三",
       price : 13,
       discount : 0.8,
       newPrice : 19,
       originPrice : 30,
       RING : "123",
       HEIGHT  : "12.34",
       SECOND_NAME : 123,
       is_vip : "true",
       month : 8,
       GIFTS : [{
           name : "宝石"
       },{
         name : "黄金"
       },{
         name : "砖石"
       }],
       ROLE:{
         NAME : "test",
         ID : "abc"
       }
 });
 /*
  {
    gift:["宝石","砖石"],
    roles:{name:"test",id:"abc"},
    ring:123,
    height:12.34,
    secondName:"123",
    isVip:true,
    fullName:"张三",
    price:10.4,
    discount:0.6333333333333333,
    month:"",
    other:"12.3412.34"
  }
  */
```

### 日期转换
转换日期格式规则参考 [date.str.format](https://www.npmjs.com/package/date.str.format)

无法逆转换

```
var transfer = new Transfer({
    birthDate : "BIRTHDATE|dateFormat|yyyy/m/dd",
 });
 var newData = transfer.convert({
       BIRTHDATE : "2017-02-10 15:2",
      
 })
 //birthDate : "2017/2/10"
```


