''' Automated Testing
	
	Documentation
	http://selenium-python.readthedocs.io/getting-started.html
'''

import getpass # prompt for password without echoing to terminal
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

limit = 5
retries = 0
# replace with whatever your port number or web url is 
base_address = 'http://localhost:8888/app/'

driver1 = webdriver.Chrome()
driver1.get(base_address + 'index.html')

# A1: User authentication supplying userid, names, image, and email address
print('Test Case A1: User authentication supplying userid, names, image, and email address')
driver1.find_element_by_id('logout').click()

origin = driver1.window_handles[0] # save for later
driver1.find_element_by_id('authenticate').click()


def login(retries, limit, browser):
	time.sleep(1+retries) # wait for popup
	browser.implicitly_wait(10)
	try:
		# switch to the popup window and ask for email
		browser.switch_to.window(browser.window_handles[1])
		browser.find_element_by_id('Email').send_keys(input('Input Email Address: ') + Keys.RETURN)
	except NoSuchElementException:
		# usually won't happen with implicitly_wait() is used, but just in case of race condition load function again
		print("Element may not have been loaded, trying again.")
		if retries < limit:
			login(retries+1, limit, browser)
	# ask for password, uses getpass library to hide password from terminal
	time.sleep(1)
	browser.find_element_by_id('Passwd').send_keys(getpass.getpass('Input Email Address: ') + Keys.RETURN)
	

login(retries, limit, driver1)
driver1.switch_to.window(origin)
retries = 0

time.sleep(3) # wait for page load

# checks the user info at the app page
print(driver1.find_element_by_id('email').text)
print(driver1.find_element_by_id('name').text)
assert(driver1.find_element_by_id('email').text != "")
assert(driver1.find_element_by_id('name').text != "")
print('User info found on app page')

# alternatively, the button can be id tagged to be found by the driver and clicked
driver1.get(base_address + 'index.html')
time.sleep(3) # wait for page to be loaded

# checks the user info at the index page
print(driver1.find_element_by_id('email').text)
print(driver1.find_element_by_id('name').text)
assert(driver1.find_element_by_id('email').text != "")
assert(driver1.find_element_by_id('name').text != "")
print('User info found on index page')

driver1.get(base_address + 'roster.html')
time.sleep(3)

# checks the user info at the roster page
print(driver1.find_element_by_id('email').text)
print(driver1.find_element_by_id('name').text)
assert(driver1.find_element_by_id('email').text != "")
assert(driver1.find_element_by_id('name').text != "")
print('user info found on roster page')


time.sleep(120) # wait some time before quitting the browser
driver1.quit()
