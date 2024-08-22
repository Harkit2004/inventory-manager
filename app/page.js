'use client'

import { useState, useEffect, useRef, use } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import { Camera } from "react-camera-pro"
// import { v4 as uuidv4 } from 'uuid'
// import { uploadFiles } from '@/utils/uploadthing'
import {load as cocoSSDLoad} from "@tensorflow-models/coco-ssd"
import * as tf from "@tensorflow/tfjs"

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [addNewIem, setAddNewItem] = useState(false)
  const [updateCurrentItem, setUpdateCurrentItem] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemNameToUpdate, setItemNameToUpdate] = useState('')
  const [net, setNet] = useState()
  const camera = useRef(null)

  // function base64ToFile(base64String) {
  //   const byteString = atob(base64String.split(',')[1]);

  //   const arrayBuffer = new ArrayBuffer(byteString.length);
  //   const uint8Array = new Uint8Array(arrayBuffer);

  //   for (let i = 0; i < byteString.length; i++) {
  //       uint8Array[i] = byteString.charCodeAt(i);
  //   }

  //   const blob = new Blob([uint8Array], { type: 'image/jpeg' });

  //   return new File([blob], uuidv4() + ".jpeg", { type: 'image/jpeg' });
  // }

  async function runCoco() {
    setNet(await cocoSSDLoad())
  }

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }

  function loadImg(img){
    return new Promise((resolve, reject) => {
      const im = new Image()
      im.crossOrigin = 'anonymous'
      im.src = img
      im.onload = () => {
        resolve(im)
      }
    })
  }
  
  async function runObjectDetection(image) {
    console.log(image)
    const img = await loadImg(image)
    const detectedObjects = await net.detect(
      img,
      undefined,
      0.6
    )
    return detectedObjects
  }

  useEffect(() => {
    updateInventory()
    runCoco()
  }, [])

  const addItem = async (name, image) => {
    let item = name
    if (!item) {
      const res = await runObjectDetection(image)
      if (res.length > 0) {
        item = res[0].class
      }
    }
    if (item) {
      const docRef = doc(collection(firestore, 'inventory'), item)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const { quantity } = docSnap.data()
        await setDoc(docRef, { quantity: quantity + 1 }, { merge: true })
      } else {
        // const files = [base64ToFile(image)]
        // const res = await uploadFiles("imageUploader", { files })
        await setDoc(docRef, { image: image, quantity: 1 })
      }
      await updateInventory()
    }    
  }
  
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true })
      }
    }
    await updateInventory()
  }

  const updateItem = async (item, newItem) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity, image } = docSnap.data()
      await deleteDoc(docRef)
      const newDocRef = doc(collection(firestore, 'inventory'), newItem)
      const newDocSnap = await getDoc(newDocRef)
      if (newDocSnap.exists()) {
        const newQuantity = docSnap.data().quantity
        await setDoc(newDocRef, { quantity: quantity + newQuantity }, { merge: true })
      } else {
        await setDoc(newDocRef, { quantity: quantity, image: image })
      }
    }
    await updateInventory()
  }

  const handleOpenAddItem = () => setAddNewItem(true)
  const handleCloseAddItem = () => setAddNewItem(false)

  const handelOpenUpdateItem = () => setUpdateCurrentItem(true)
  const handelCloseUpdateItem = () => setUpdateCurrentItem(false)

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
    >
      <Modal
        open={addNewIem}
        onClose={handleCloseAddItem}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Camera ref={camera} aspectRatio={16 / 9} />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(null, camera.current.takePhoto())
                setItemName('')
                handleCloseAddItem()
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Modal
        open={updateCurrentItem}
        onClose={handelCloseUpdateItem}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Update Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                updateItem(itemNameToUpdate, itemName)
                setItemName('')
                setItemNameToUpdate('')
                handelCloseUpdateItem()
              }}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>
      {net && <Button variant="contained" onClick={handleOpenAddItem}>
        Add New Item
      </Button>}
      <Box border={'1px solid #333'}>
        <Box
          width="800px"
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
          {inventory.map(({name, quantity, image}) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <img height={100} width={150} src={image} alt="item img"/>
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                Quantity: {quantity}
              </Typography>
              {net && <Button variant="contained" onClick={() => addItem(name, image)}>
                Add
              </Button>}
              <Button variant="contained" onClick={() => removeItem(name)}>
                Remove
              </Button>
              <Button variant="contained" onClick={() => { 
                setItemNameToUpdate(name)
                handelOpenUpdateItem()
              }}>
                Update
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}