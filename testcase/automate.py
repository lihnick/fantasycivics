''' Conditions that needs automation testing


L1: User can create multiple leagues with same name
L1: League start date is before the end date
L1: Leagues have an even number of users
L1: Every user in a league plays one match each week
L1: The number of matches in each week of a league is equal to half the number of users in the league
L2: Changing a user’s roster in one league DO NOT affect their roster in another league they are part of
L3: All users who accepted a league invitation are part of the created league
'''

import getpass # prompt for password without echoing to terminal
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

limit = 5
retries = 0
web_address = 'http://localhost:8000/app/index.html'

driver1 = webdriver.Chrome()
driver1.get(web_address)

# A1: User authentication supplying userid, names, image, and email address
print('Test Case A1: User authentication supplying userid, names, image, and email address')
driver1.find_element_by_id('logout').click()

origin = driver1.window_handles[0] # save for later
driver1.find_element_by_id('authenticate').click()


def login(retries, limit, browser):
	time.sleep(1+retries) # wait for popup
	browser.implicitly_wait(10)
	try:
		browser.switch_to.window(browser.window_handles[1])
		browser.find_element_by_id('Email').send_keys(input('Input Email Address: ') + Keys.RETURN)
	except NoSuchElementException:
		print("Element may not have been loaded, trying again.")
		if retries < limit:
			login(retries+1, limit, browser)
	time.sleep(1)
	browser.find_element_by_id('Passwd').send_keys(getpass.getpass('Input Email Address: ') + Keys.RETURN)
	

login(retries, limit, driver1)
driver1.switch_to.window(origin)
retries = 0

time.sleep(3) # wait for page load

print(driver1.find_element_by_id('email').text)
print(driver1.find_element_by_id('name').text)



