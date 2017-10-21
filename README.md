# Space Foundation Europa Drone

Control an underwater drone with a USB gamepad, designed for use in the [Space Foundation Discovery Center's](https://discoverspace.org) Mission To Europa interactive exhibit.

## Work-In-Progress

This project is still a work-in-progress. Stay tuned for updates.

## Ingredients

- Raspberry Pi (tested with Pi 3B)
- [Adafruit 16-Channel PWM / Servo HAT for Raspberry Pi - Mini Kit](https://www.adafruit.com/product/2327)
- (more soon)

## Hardware Setup

More soon on this. Note: When plugging in servos or ESCs, make sure the ground/usually black/usually brown wire is on the bottom/out facing pin.

## Install Raspbian

Install the latest Raspbian to Micro SD Card (installed via a Mac in this example). See additional installation guidelines [here](https://www.raspberrypi.org/documentation/installation/installing-images/README.md).

Download Raspbian (lite version) .zip at https://www.raspberrypi.org/downloads/ and unzip.

Insert the disk that will be used the Pi (via USB or disk port [update with proper names]) In terminal:

`diskutil list`

```
/dev/disk0
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *500.3 GB   disk0
   1:                        EFI EFI                     209.7 MB   disk0s1
   2:                  Apple_HFS Macintosh HD            249.0 GB   disk0s2
   3:                 Apple_Boot Recovery HD             650.0 MB   disk0s3
   4:       Microsoft Basic Data
```

Then insert disk to format and compare:

`diskutil list`

```
/dev/disk0
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *500.3 GB   disk0
   1:                        EFI EFI                     209.7 MB   disk0s1
   2:                  Apple_HFS Macintosh HD            249.0 GB   disk0s2
   3:                 Apple_Boot Recovery HD             650.0 MB   disk0s3
   4:       Microsoft Basic Data                         130.1 GB   disk0s4
/dev/disk2
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:     FDisk_partition_scheme                        *15.6 GB    disk2
   1:             Windows_FAT_32 boot                    58.7 MB    disk2s1
   2:                      Linux                         7.8 GB     disk2s2
```

disk2 is the inserted disk in this case.

Unmount that disk (change “2” to inserted disk!):

`diskutil unmountDisk /dev/disk2`

Burn image to disk (change “2” to inserted disk, and update .img name/location):

`sudo dd bs=4m if=~/Downloads/2017-09-07-raspbian-stretch-lite.img of=/dev/disk2`

Wait a very long time. Go make some coffee. Eat a snack (or even dinner). Go for a walk. Start watching a fascinating documentary. Don’t interrupt the process. ;)

Tip: If you want to see what it’s doing, enter control+t in the terminal. It will give a quick line like “load: 2.73  cmd: dd 3344 uninterruptible 0.00u 5.27s”, then follow up after a short while with something like this:

```
115+0 records in
114+0 records out
478150656 bytes transferred in 10703.183951 secs (44674 bytes/sec)
```

Just let it run.

When finished, eject the disk from Mac (it will get mounted as “boot”), and insert it into the Pi. Plug in a USB keyboard, USB mouse, then turn on the Pi by plugging in its power cord. The Pi should boot, working with the Pi touchscreen right away.

## Configure Raspbian

Insert the prepared Micro SD card into the Pi. With a USB keyboard, HDMI to TV and Ethernet connection plugged in, plug in the power to boot up.

Configure the Pi with raspi-config.

```
sudo raspi-config
```

It's important to change the password for security purposes. Choose "1 Change password for the current user", then "<Ok>", then follow the prompts.

Change the hostname to something other than raspberrypi if connecting to the network (your IT team will thank you). Choose "2 Hostname", then enter a new name that describes this Pi e.g. "europa-drone-1".

Go back to the main screen and select "<Finish>", then choose "<Yes>" to reboot.

## Install Dependencies

Update and upgrade apt-get which will be used to install needed software.

```
sudo apt-get update
sudo apt-get upgrade
```

Install Git.

```
sudo apt-get install git
```

Install Nodejs.

```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Follow these instructions to install and configure i2c requirements so that the Pi can communicate with the Pi servo hat. Some of the instructions won't match exactly e.g. commenting out something in a file with nothing to comment out and an old version of something not being supported, but it should work for this project:

[https://www.npmjs.com/package/i2c](https://www.npmjs.com/package/i2c)

## Install Project Code

Install this project to the Pi.

```
cd ~
git clone https://github.com/owntheweb/europa-drone.git
```

## Test

Run the following:

```
node europa-drone/index.js
```

## Start Script On Boot

Edit startup script to run loop that keeps the node script running indefinitely on boot, restarting if it crashes.

```
sudo nano /etc/rc.local
```

Add this *before* the "exit 0" line:

```
(runuser -l pi -c '/bin/bash /home/pi/europa-drone/bash/loop.bash')&
```

Restart the Pi. After it is booted, the script should running.

## To Be Continued...

Testing notes need to be added. Hardware setup is still being worked out. Anything else missing will be added as available.

Stay tuned!
