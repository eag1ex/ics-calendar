

// test all promises


const p = [Promise.resolve(1),Promise.resolve(2),Promise.resolve(3)]
const onready = Promise.all(p).then(z=>{
    console.log('what is z',z)
    return z
})

 ( async()=>{
    const d = await onready
    console.log('on ready',d)
    return d    
})().catch(err=>{
    console.log('on err',err)    
})


