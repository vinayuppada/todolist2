const bodyParser = require('body-parser');
const { render } = require('ejs');
const express = require('express');
const mongoose =require('mongoose');
const _ = require("lodash");



const app = express()

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs')
mongoose.set('strictQuery', true);

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema={
    name:String
};

const Item= mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name:"Welocme to your todolist!"
});

const item2 = new Item({
    name:"Hit the + button to add a new item "
});

const item3 = new Item({
    name:"<-- hit this to delete an item"
});
  
const defaultItems =[item1,item2,item3];

const listSchema={
    name:String,
    items:[itemsSchema]
};
const List = mongoose.model("List",listSchema);


app.get('/',function(req,res){

    Item.find({},function(err,foundItems){

     if(foundItems.length === 0){
        Item.insertMany(defaultItems,function(err){
            if(err){
                console.log(err);
        
            }else{
                console.log("Successfully saved dafault item to DB");
            }
        });
        res.redirect("/");
       }else{
        res.render("index",{listTitle : "Today",newListItems: foundItems})

       }

    });

  
   

});

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

List.findOne({name:customListName},function(err,foundList){
    if(!err){
        if(!foundList){
            const list =new List({
                name:customListName,
                items:defaultItems
               });
            
               list.save();
               res.redirect("/"+ customListName);

        }else{
            res.render("index",{listTitle:foundList.name, newListItems: foundList.items});
            
        }
    }
});



});

    app.post("/",function(req,res){
        
        var itemName =req.body.newItem;
        const listName = req.body.index;

        const item = new Item({
            name:itemName
        });

        if(listName === "Today"){
            item.save();
            res.redirect("/");
        }else{
            List.findOne({name:listName},function(err,foundList){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+ listName);
            });
        }

      
        
    });

    app.post("/delete", function(req,res){
       const checkedItemId =req.body.checkbox;
       const listName = req.body.listName;

       if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId,function(err){
            if(!err){
                console.log("successfully deleted checked item");
                res.redirect("/");
            }
           });
       } else {
        List.findOneAndUpdate({name:listName},{$pull:{items: {_id: checkedItemId}}},function(err,foundList){
          if(!err){
            res.redirect("/"+listName);
          }  
        });
       }
      
    });
    
  
    
// app.post("/work",function(req,res){
//     let item =req.body.newItem;
//     worrkItems.push(item);
//     res.redirect("/work");
// });
app.get("/about",function(req,res){
    res.render("about");
});
app.listen(process.env.PORT || 5000,function(){
    console.log("server started on port 5000");
});
