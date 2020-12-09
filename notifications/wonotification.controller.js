const express = require('express')
const router = express.Router()
const wo_notification = require('./wonotification.model');

/* register notifications */
router.post("/register", async (req, res, next) => {
    const { body } = req;
    console.log(body)
    const {undo, recipient_id, notifier_id, post_id, comment_id, reply_id, type, type2, text, url, time, event_id,page_id, group_id, thread_id, story_id, blog_id,group_chat_id , seen_pop,  full_link, seen,sent_push, admins} = body
    const params = {recipient_id, notifier_id, post_id, comment_id, reply_id, type, type2, text, url, time }
    if(event_id){
        params['event_id'] = event_id
    }
    if(page_id){
        params['page_id'] = page_id
    }
    if(group_id){
        params['group_id'] = group_id
    }
    if(thread_id){
        params['thread_id'] = thread_id
    }
    if(story_id){
        params['story_id'] = story_id
    }
    if(blog_id){
        params['blog_id'] = blog_id
    }
    if(group_chat_id){
        params['group_chat_id'] = group_chat_id
    }
    if(group_chat_id){
        params['group_chat_id'] = group_chat_id
    }
    if(seen_pop){
        params['seen_pop'] = seen_pop
    }
    if(full_link){
        params['full_link'] = full_link
    }
    if(seen){
        params['seen'] = seen
    }
    if(sent_push){
        params['sent_push'] = sent_push
    }
    try {
        // const notifi = await wo_notification.find({ recipient_id, post_id, type })
        // if (notifi && !admins) {
        //     if (type !== "following" && type !== "reaction") {
        //         await wo_notification.deleteMany({ recipient_id, post_id, type }, (err) => {
        //             if (err) {
        //                 console.log(err.message)
        //                 res.status(302).json({ message: "Có lỗi gì đó!" })
        //             }
        //         });
        //     }
        // }
        if (!undo && undo !== true) {
            if (admins) {
                wo_notification.insertMany(admins).then(function(){ 
                    res.status(200).json({
                        message: 'Post created successfully!',
                        post: result
                    });
                })
                .catch(err => {
                    console.log(err.message)
                    res.status(302).json({ message: "Insert fail" })
                });
            } else {
                const wonotification = new wo_notification({ ...params });
                wonotification.save()
                    .then(result => {
                        res.status(200).json({
                            message: 'Post created successfully!',
                            post: result
                        });
                    })
                    .catch(err => {
                        console.log(err.message)
                        res.status(302).json({ message: "Insert fail" })
                    })
            }
            
        }
    } catch (err) {
        res.status(302).json({ message: "Có lỗi gì đó!" })
    }

})

/* find notification */

router.post("/find", async (req, res, next) => {
    try{
        const { body } = req;
        const params = body
        const sort = {_id:-1};
        let limit ;
        if (body.sort) {
            // const arr = body.sort.split(',')
            // arr.forEach(element => { 
            //     if (element === '-id')  return sort['_id'] = -1
            //     if (element === 'id')  return sort['_id'] = 1
            // });
            delete params.sort
        }
        if (body.limit) {
            limit = body.limit
            delete params.limit
        }
        const count = await wo_notification.countDocuments({ ...params });
        const result = await wo_notification.find({ ...params }).sort(sort).limit(limit);
        const results = [];
            result.forEach((value,index) =>{
                const id = value._id
                results.push({...value._doc, id })
            })
            res.status(200).json({
                message: 'successfully!',
                result: results,
                count:count
            });
    }catch(error){
        console.log(err.message)
        res.status(302).json({ message: "select fail" })

    }
    
})

/* update notifications */
router.put("/update", async (req, res, next) => {
    const { body } = req
    const { where, values } = body
    wo_notification.updateMany({
        ...where
    }, { ...values })
        .then(result => {
            res.status(200).json({
                message: 'update successfully!',
                result: true
            });
        })
        .catch(err => {
            console.log(err.message)
            res.status(302).json({ message: "Update fail" })
        })
})

/* delete notifications */
router.delete("/delete", async (req, res, next) => {
    const { body } = req;
    const params = body;
    if(body.lt){
       const lt = body.lt.split(",");
       lt.forEach(element => { 
            delete params[element];
            params[element] = {$lt:body[element] }
        });
        delete params.lt;
    }
    if(body.gte){
       const gte = body.gte.split(",");
       gte.forEach(element => { 
            delete params[element];
            params[element] = {$gte:body[element] }
        });
        delete params.gte;
    }
    if (body.ne) {
        const ne = body.ne.split(",");
        ne.forEach(element => {
            delete params[element];
            params[element] = { $gte: body[element] }
        });
        delete params.ne;
    }
    wo_notification.deleteMany({ params })
        .then(result => {
            res.status(200).json({
                message: 'update successfully!',
                post: result
            });
        })
        .catch(err => {
            console.log(err.message)
            res.status(302).json({ message: "Insert fail" })
        })
})

module.exports = router
